from pydantic import BaseModel, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    message: str


class RoleResponse(BaseModel):
    user_id: str
    roles: list[str]
    sprint: int
    hu_id: str


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
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
    guest_id: int
    username: str
    email: EmailStr
    role: str
    jurisdiction_id: int
    message: str
