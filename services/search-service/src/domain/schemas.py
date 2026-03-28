from pydantic import BaseModel, Field


class SearchHotelsQuery(BaseModel):
    destination: str = Field(min_length=2)
    check_in: str
    check_out: str
    guests: int = Field(ge=1)


class SearchResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    results: list[dict]


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
