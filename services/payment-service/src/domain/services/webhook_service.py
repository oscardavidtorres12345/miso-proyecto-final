from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import WebhookEventStatus
from src.infrastructure.database.models import WebhookEvent


class WebhookAlreadyProcessedError(Exception):
    pass


class WebhookService:
    def is_already_processed(self, db: Session, stripe_event_id: str) -> bool:
        stmt = select(WebhookEvent).where(WebhookEvent.stripe_event_id == stripe_event_id)
        event = db.execute(stmt).scalar_one_or_none()
        return event is not None

    def create_webhook_event(
        self, db: Session, *, stripe_event_id: str, event_type: str,
        payload: dict, payment_id: Optional[str] = None
    ) -> WebhookEvent:
        event = WebhookEvent(
            event_id=str(uuid4()),
            stripe_event_id=stripe_event_id,
            event_type=event_type,
            payment_id=payment_id,
            status=WebhookEventStatus.RECEIVED.value,
            payload=json.dumps(payload),
            received_at=datetime.now(timezone.utc),
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def mark_as_processing(self, db: Session, event_id: str) -> WebhookEvent:
        event = db.get(WebhookEvent, event_id)
        if not event:
            raise ValueError(f"WebhookEvent {event_id} not found")
        event.status = WebhookEventStatus.PROCESSING.value
        db.commit()
        db.refresh(event)
        return event

    def mark_as_processed(self, db: Session, event_id: str) -> WebhookEvent:
        event = db.get(WebhookEvent, event_id)
        if not event:
            raise ValueError(f"WebhookEvent {event_id} not found")
        event.status = WebhookEventStatus.PROCESSED.value
        event.processed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        return event

    def mark_as_failed(self, db: Session, event_id: str) -> WebhookEvent:
        event = db.get(WebhookEvent, event_id)
        if not event:
            raise ValueError(f"WebhookEvent {event_id} not found")
        event.status = WebhookEventStatus.FAILED.value
        event.processed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        return event


webhook_service = WebhookService()
