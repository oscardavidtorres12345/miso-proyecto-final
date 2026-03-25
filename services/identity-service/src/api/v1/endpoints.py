from fastapi import APIRouter

from src.domain.schemas import LoginRequest, LoginResponse, RoleResponse

router = APIRouter(prefix="/identity")


@router.post("/auth/web/login", response_model=LoginResponse)
def web_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=1,
        hu_id="HU001",
        message="Autenticacion web base creada. Pendiente core de identidad.",
    )


@router.get("/auth/roles/{user_id}", response_model=RoleResponse)
def get_roles(user_id: str) -> RoleResponse:
    return RoleResponse(
        user_id=user_id,
        roles=["guest"],
        sprint=1,
        hu_id="HU025",
    )


@router.post("/auth/portal/login", response_model=LoginResponse)
def portal_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=2,
        hu_id="HU010",
        message="Autenticacion de portal hotelero habilitada como base.",
    )


@router.post("/auth/mobile/login", response_model=LoginResponse)
def mobile_login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU015",
        message="Autenticacion movil habilitada como base.",
    )
