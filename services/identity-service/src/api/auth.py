import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, Request, status

JWT_SECRET = os.getenv("JWT_SECRET", "travelhub-dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "dev-internal-token")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def _decode_json(segment: str) -> dict[str, Any]:
    try:
        data = json.loads(_b64url_decode(segment).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT structure.",
        ) from exc
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT structure.",
        )
    return data


def _verify_hs256(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT structure.",
        )

    header_seg, payload_seg, sig_seg = parts
    header = _decode_json(header_seg)
    payload = _decode_json(payload_seg)

    alg = str(header.get("alg", "")).upper()
    if alg != JWT_ALGORITHM.upper():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT algorithm is not allowed.",
        )
    if JWT_ALGORITHM.upper() != "HS256":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unsupported JWT algorithm configuration.",
        )

    signing_input = f"{header_seg}.{payload_seg}".encode("utf-8")
    expected_sig = hmac.new(
        JWT_SECRET.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    expected_sig_seg = (
        base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")
    )

    if not hmac.compare_digest(expected_sig_seg, sig_seg):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired JWT.",
        )

    now_ts = int(datetime.now(timezone.utc).timestamp())
    exp = payload.get("exp")
    if exp is not None:
        try:
            if int(exp) < now_ts:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired JWT.",
                )
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid JWT claims.",
            ) from exc

    return payload


def _parse_bearer_claims(authorization: str | None) -> dict[str, Any] | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format.",
        )
    return _verify_hs256(token.strip())


def _normalize_permissions(claims: dict[str, Any]) -> set[str]:
    raw = claims.get("permissions")
    if isinstance(raw, list):
        return {str(value).strip().upper() for value in raw if str(value).strip()}
    if isinstance(raw, str):
        value = raw.strip().upper()
        return {value} if value else set()
    return set()


def _normalize_scopes(claims: dict[str, Any]) -> set[str]:
    raw_scope = claims.get("scope", claims.get("scopes"))
    if isinstance(raw_scope, str):
        return {scope.strip() for scope in raw_scope.split(" ") if scope.strip()}
    if isinstance(raw_scope, list):
        return {str(scope).strip() for scope in raw_scope if str(scope).strip()}
    return set()


def require_permissions(*required_permissions: str):
    required = {permission.strip().upper() for permission in required_permissions}

    def _dependency(request: Request) -> None:
        claims = _parse_bearer_claims(request.headers.get("Authorization"))
        if claims is not None:
            granted = _normalize_permissions(claims)
        else:
            # Backward-compatible fallback while all clients migrate to JWT.
            raw_permissions = request.headers.get("X-User-Permissions", "")
            granted = {
                permission.strip().upper()
                for permission in raw_permissions.split(",")
                if permission.strip()
            }

        missing = sorted(required - granted)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission(s): {', '.join(missing)}",
            )

    return _dependency


def require_internal_service(required_scope: str = "identity:auto_block"):
    def _dependency(request: Request) -> None:
        claims = _parse_bearer_claims(request.headers.get("Authorization"))
        if claims is not None:
            token_type = str(claims.get("token_type", "")).strip().lower()
            scopes = _normalize_scopes(claims)
            if token_type == "service" and required_scope in scopes:
                return
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Service JWT with required scope is required.",
            )

        # Backward-compatible fallback while internal callers migrate to JWT m2m.
        provided_token = request.headers.get("X-Internal-Token", "")
        if not provided_token or provided_token != INTERNAL_SERVICE_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid internal service token.",
            )

    return _dependency
