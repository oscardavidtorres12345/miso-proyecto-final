from pydantic import BaseModel, EmailStr, Field


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
