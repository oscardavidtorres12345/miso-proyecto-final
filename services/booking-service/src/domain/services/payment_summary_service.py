from __future__ import annotations

from datetime import date

from src.domain.schemas import PaymentSummary

_DEFAULT_TAX_RATE = 0.19


class PaymentSummaryError(Exception):
    pass


def build_payment_summary(
    *,
    hotel_detail: dict,
    room_id: int,
    check_in: date,
    check_out: date,
    units: int,
) -> PaymentSummary:
    room = _find_room(hotel_detail, room_id)
    nights = (check_out - check_in).days
    if nights <= 0:
        raise PaymentSummaryError("Invalid stay duration for payment summary.")

    price = room.get("price") or {}
    price_per_night = float(price.get("pricePerNight", 0))
    total_including_taxes = float(price.get("totalAmount", 0))
    currency = (price.get("currency") or "COP").upper()

    accommodation = int(round(price_per_night * nights))
    detail_total = int(round(total_including_taxes))

    # Use detail total as authoritative when available.
    if detail_total > 0:
        if accommodation <= 0:
            # Fallback when detail only includes totalAmount (no nightly value).
            accommodation = int(round(detail_total / (1 + _DEFAULT_TAX_RATE)))
        accommodation = min(accommodation, detail_total)
        taxes = max(detail_total - accommodation, 0)
    else:
        taxes = 0

    if accommodation <= 0:
        raise PaymentSummaryError(
            "Pricing detail is unavailable for selected room/date range."
        )

    # Temporary deterministic components until payment-pricing service exists.
    fees = int(round(accommodation * 0.10))
    insurance = 20000 * max(units, 1)
    if detail_total > 0:
        # Keep total aligned with the amount shown in Search detail.
        discount = detail_total - (accommodation + fees + taxes + insurance)
        total = detail_total
    else:
        discount = -int(round(accommodation * 0.05))
        total = accommodation + fees + taxes + insurance + discount

    if total < 0:
        raise PaymentSummaryError("Computed total cannot be negative.")

    return PaymentSummary(
        accommodation=accommodation,
        fees=fees,
        taxes=taxes,
        insurance=insurance,
        discount=discount,
        total=total,
        currency=currency,
    )


def _find_room(hotel_detail: dict, room_id: int) -> dict:
    rooms = hotel_detail.get("rooms") or []
    for room in rooms:
        if room.get("id") == room_id:
            return room
    raise PaymentSummaryError("Room does not belong to selected property.")
