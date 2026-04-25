from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from src.api import auth as auth_mod
from src.api.auth import resolve_request_user_id

_SECRET = "travelhub-dev-secret"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _jwt(payload: dict, header: dict | None = None) -> str:
    hdr = header or {"alg": "HS256", "typ": "JWT"}
    h = _b64url(json.dumps(hdr, separators=(",", ":")).encode("utf-8"))
    p = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(
        _SECRET.encode("utf-8"), f"{h}.{p}".encode("utf-8"), hashlib.sha256
    ).digest()
    return f"{h}.{p}.{_b64url(sig)}"


def test_auth_missing_and_header_format() -> None:
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=None, x_user_id=None)
    assert resolve_request_user_id(authorization=None, x_user_id=11) == 11
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization="Basic abc", x_user_id=None)


def test_auth_valid_and_claim_variants() -> None:
    tok = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    assert resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None) == 7

    tok2 = _jwt(
        {
            "user_id": 8,
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    assert resolve_request_user_id(authorization=f"Bearer {tok2}", x_user_id=None) == 8


def test_auth_invalid_signature_exp_nbf_and_claims() -> None:
    tok = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    bad = tok[:-1] + ("a" if tok[-1] != "a" else "b")
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {bad}", x_user_id=None)

    expired = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
        }
    )
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {expired}", x_user_id=None)

    nbf_future = _jwt(
        {
            "sub": "7",
            "nbf": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {nbf_future}", x_user_id=None)

    bad_claim = _jwt({"sub": "abc"})
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {bad_claim}", x_user_id=None)


def test_auth_invalid_algorithm_and_config(monkeypatch: pytest.MonkeyPatch) -> None:
    wrong_alg = _jwt({"sub": "7"}, header={"alg": "HS512", "typ": "JWT"})
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {wrong_alg}", x_user_id=None)

    monkeypatch.setattr(auth_mod, "_JWT_ALGORITHM", "HS512")
    with pytest.raises(HTTPException):
        auth_mod._verify_hs256("a.b.c")
