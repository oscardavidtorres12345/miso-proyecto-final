import os

import httpx


class SearchCatalogError(Exception):
    pass


class SearchCatalogClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("SEARCH_SERVICE_URL", "http://search-service:8000")
        self.timeout_seconds = float(os.getenv("SEARCH_CATALOG_TIMEOUT_SECONDS", "5"))
        self.internal_api_token = os.getenv(
            "INTERNAL_API_TOKEN", "travelhub-internal-dev-token"
        )

    def fetch_rooms(self) -> list[dict]:
        url = f"{self.base_url.rstrip('/')}/api/v1/internal/catalog/rooms"
        try:
            response = httpx.get(
                url,
                headers={"X-Internal-Token": self.internal_api_token},
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:
            raise SearchCatalogError("Search catalog request failed.") from exc

        if response.status_code >= 300:
            detail = response.text or "Search catalog request failed."
            try:
                body = response.json()
                detail = body.get("detail") or detail
            except ValueError:
                pass
            raise SearchCatalogError(str(detail))

        data = response.json()
        rooms = data.get("rooms")
        if not isinstance(rooms, list):
            raise SearchCatalogError("Invalid catalog response payload.")
        return rooms

    def create_room(
        self,
        *,
        property_id: int,
        room_type: str,
        max_capacity: int = 2,
        bed_type: str | None = None,
        description: str | None = None,
        image_url: str | None = None,
    ) -> dict:
        url = f"{self.base_url.rstrip('/')}/api/v1/internal/catalog/rooms"
        payload = {
            "property_id": int(property_id),
            "room_type": str(room_type),
            "max_capacity": int(max_capacity),
            "bed_type": bed_type,
            "description": description,
            "image_url": image_url,
        }
        try:
            response = httpx.post(
                url,
                json=payload,
                headers={"X-Internal-Token": self.internal_api_token},
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:
            raise SearchCatalogError(
                "Search catalog create-room request failed."
            ) from exc

        if response.status_code >= 300:
            detail = response.text or "Search catalog create-room request failed."
            try:
                body = response.json()
                detail = body.get("detail") or detail
            except ValueError:
                pass
            raise SearchCatalogError(str(detail))

        data = response.json()
        room = data.get("room")
        if not isinstance(room, dict):
            raise SearchCatalogError("Invalid create-room response payload.")
        if not isinstance(room.get("room_id"), int):
            raise SearchCatalogError("Invalid create-room response payload.")
        return room


search_catalog_client = SearchCatalogClient()
