from typing import List

from pydantic import BaseModel


class SearchResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    results: List = []


class PerformanceStatus(BaseModel):
    status: str
    sprint: int
    hu_id: str
    indexed_hotels: int


class AutoscalingSignalResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    target_metric: str
    current_value: float


__all__ = [
    "SearchResponse",
    "PerformanceStatus",
    "AutoscalingSignalResponse",
]
