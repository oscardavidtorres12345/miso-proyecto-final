"""Unit tests para los schemas de identity-service."""

import pytest
from pydantic import ValidationError

from src.domain.schemas import LoginRequest, RegisterRequest


class TestLoginRequest:
    def test_valid(self) -> None:
        r = LoginRequest(email="user@example.com", password="secret123")
        assert r.email == "user@example.com"

    def test_invalid_email_raises(self) -> None:
        with pytest.raises(ValidationError):
            LoginRequest(email="not-an-email", password="secret123")

    def test_short_password_raises(self) -> None:
        with pytest.raises(ValidationError):
            LoginRequest(email="user@example.com", password="abc")

    def test_jurisdiction_optional(self) -> None:
        r = LoginRequest(email="user@example.com", password="secret123")
        assert r.requested_jurisdiction is None

    def test_jurisdiction_accepted(self) -> None:
        r = LoginRequest(
            email="user@example.com", password="secret123", requested_jurisdiction="CO"
        )
        assert r.requested_jurisdiction == "CO"


class TestRegisterRequest:
    _VALID = dict(
        first_name="Oscar",
        last_name="Torres",
        email="oscar@example.com",
        document_type_id=1,
        document_id="12345",
        jurisdiction_id=1,
        password="securepass",
        password_confirmation="securepass",
    )

    def test_valid(self) -> None:
        r = RegisterRequest(**self._VALID)
        assert r.first_name == "Oscar"

    def test_passwords_mismatch_raises(self) -> None:
        data = {**self._VALID, "password_confirmation": "different"}
        with pytest.raises(ValidationError, match="Password and confirmation"):
            RegisterRequest(**data)

    def test_empty_first_name_raises(self) -> None:
        data = {**self._VALID, "first_name": ""}
        with pytest.raises(ValidationError):
            RegisterRequest(**data)

    def test_invalid_email_raises(self) -> None:
        data = {**self._VALID, "email": "bad-email"}
        with pytest.raises(ValidationError):
            RegisterRequest(**data)

    def test_short_password_raises(self) -> None:
        data = {**self._VALID, "password": "abc", "password_confirmation": "abc"}
        with pytest.raises(ValidationError):
            RegisterRequest(**data)

    def test_document_type_id_must_be_positive(self) -> None:
        data = {**self._VALID, "document_type_id": 0}
        with pytest.raises(ValidationError):
            RegisterRequest(**data)
