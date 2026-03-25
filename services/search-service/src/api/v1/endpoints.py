from fastapi import APIRouter

from src.domain.schemas import (
    AutoscalingSignalResponse,
    PerformanceStatus,
    SearchResponse,
)

router = APIRouter(prefix="/search")


@router.get("/hotels", response_model=SearchResponse)
def search_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1,
) -> SearchResponse:
    _ = (destination, check_in, check_out, guests)
    return SearchResponse(
        status="not_implemented",
        sprint=1,
        hu_id="HU002",
        results=[],
    )


@router.get("/performance/status", response_model=PerformanceStatus)
def performance_status() -> PerformanceStatus:
    return PerformanceStatus(
        status="not_implemented",
        sprint=1,
        hu_id="HU023",
        indexed_hotels=0,
    )


@router.get("/ops/autoscaling/signal", response_model=AutoscalingSignalResponse)
def autoscaling_signal() -> AutoscalingSignalResponse:
    return AutoscalingSignalResponse(
        status="not_implemented",
        sprint=2,
        hu_id="HU022",
        target_metric="requests_per_second",
        current_value=0.0,
    )


@router.get("/mobile", response_model=SearchResponse)
def mobile_search(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1,
) -> SearchResponse:
    _ = (destination, check_in, check_out, guests)
    return SearchResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU016",
        results=[],
    )
