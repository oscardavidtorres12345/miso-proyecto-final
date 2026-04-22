import os

from fastapi import Header, HTTPException, status


_INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "travelhub-internal-dev-token")


def require_internal_token(
    x_internal_token: str | None = Header(default=None, alias="X-Internal-Token"),
) -> None:
    if not x_internal_token or x_internal_token != _INTERNAL_API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service token.",
        )
