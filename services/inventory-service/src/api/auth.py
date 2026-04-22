import os
import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import Header, HTTPException, status


_JWT_SECRET = os.getenv("JWT_SECRET", "travelhub-dev-secret")
_JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def _user_id_from_claims(claims: dict) -> int | None:
    raw = claims.get("sub", claims.get("user_id"))
    if raw is None:
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.strip().isdigit():
        return int(raw.strip())
    return None


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def _decode_json(segment: str) -> dict[str, Any]:
    try:
        raw = _b64url_decode(segment)
        data = json.loads(raw.decode("utf-8"))
        if isinstance(data, dict):
            return data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT structure.",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid JWT structure.",
    )


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
    if alg != _JWT_ALGORITHM.upper():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT algorithm is not allowed.",
        )

    if _JWT_ALGORITHM.upper() != "HS256":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unsupported JWT algorithm configuration.",
        )

    signing_input = f"{header_seg}.{payload_seg}".encode("utf-8")
    expected_sig = hmac.new(
        _JWT_SECRET.encode("utf-8"),
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
    nbf = payload.get("nbf")

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

    if nbf is not None:
        try:
            if int(nbf) > now_ts:
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


def resolve_request_user_id(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_user_id: int | None = Header(default=None, alias="X-User-Id"),
) -> int:
    # Backward-compatible fallback so existing clients keep working.
    if not authorization:
        if x_user_id is not None:
            return x_user_id
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format.",
        )

    claims = _verify_hs256(token.strip())

    user_id = _user_id_from_claims(claims)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT is missing a valid user identifier.",
        )
    return user_id
