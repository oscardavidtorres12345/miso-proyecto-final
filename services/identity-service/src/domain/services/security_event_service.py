from sqlalchemy.orm import Session

from src.domain.schemas import SecurityEventItem, SecurityEventListResponse
from src.infrastructure.repositories.user_repository import list_security_events


def list_security_events_service(
    db: Session,
    *,
    status: str | None = None,
    event_type: str | None = None,
    target_user_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> SecurityEventListResponse:
    total, events = list_security_events(
        db,
        status=status,
        event_type=event_type,
        target_user_id=target_user_id,
        limit=limit,
        offset=offset,
    )
    return SecurityEventListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[
            SecurityEventItem(
                event_id=event.event_id,
                correlation_id=event.correlation_id,
                event_type=event.event_type,
                severity=event.severity,
                status=event.status,
                source_service=event.source_service,
                source_log_id=event.source_log_id,
                actor_user_id=event.actor_user_id,
                target_user_id=event.target_user_id,
                source_ip=event.source_ip,
                rule_code=event.rule_code,
                action_taken=event.action_taken,
                blocked_until=event.blocked_until,
                event_timestamp=event.event_timestamp,
                metadata=event.event_metadata or {},
            )
            for event in events
        ],
    )
