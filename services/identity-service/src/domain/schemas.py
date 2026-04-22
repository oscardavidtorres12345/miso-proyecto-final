from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    requested_jurisdiction: str | None = Field(default=None, min_length=2, max_length=2)


class LoginUserInfo(BaseModel):
    user_id: int
    username: str
    email: EmailStr
    role: str | None = None
    is_active: bool


class GuestInfo(BaseModel):
    guest_id: int
    full_name: str
    document_type_id: int
    document_id: str
    contact_email: EmailStr | None = None
    jurisdiction_id: int


class UserProfileResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    user: LoginUserInfo
    guest: GuestInfo | None = None


class LoginResponse(BaseModel):
    status: str
    sprint: int | None = None
    hu_id: str | None = None
    message: str
    user: LoginUserInfo | None = None
    permissions: list[str] = []
    session_ttl_seconds: int | None = None
    session_expires_at: datetime | None = None


class RoleResponse(BaseModel):
    user_id: str
    roles: list[str]
    sprint: int
    hu_id: str


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    document_type_id: int = Field(ge=1)
    document_id: str = Field(min_length=1, max_length=50)
    jurisdiction_id: int = Field(ge=1)
    password: str = Field(min_length=8, max_length=128)
    password_confirmation: str = Field(min_length=8, max_length=128)
    role: str | None = None

    @model_validator(mode="after")
    def validate_passwords_match(self) -> "RegisterRequest":
        if self.password != self.password_confirmation:
            raise ValueError("Password and confirmation password must match.")
        return self


class RegisterResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    user_id: int
    guest_id: int | None = None
    username: str
    email: EmailStr
    role: str
    jurisdiction_id: int
    message: str


class PrivacyNoticeResponse(BaseModel):
    iso_code: str
    jurisdiction_name: str
    applicable_regulation: str
    privacy_title: str
    privacy_content: str
    privacy_pdf_url: list[str]
    privacy_version: str
    privacy_effective_at: datetime | None = None
    privacy_contact_email: EmailStr


class BlockUserRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=255)
    ttl_minutes: int | None = Field(default=None, ge=1, le=10080)


class UnblockUserRequest(BaseModel):
    reason: str | None = Field(default=None, min_length=3, max_length=255)


class UserBlockActionResponse(BaseModel):
    status: str
    user_id: int
    is_blocked: bool
    severity: str
    unblock_policy: str
    blocked_until: datetime | None = None
    message: str


class AutoBlockUserRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=255)
    severity: str = Field(default="HIGH", min_length=3, max_length=20)
    ttl_minutes: int | None = Field(default=None, ge=1, le=10080)
