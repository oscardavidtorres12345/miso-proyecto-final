from __future__ import annotations

from datetime import date

from src.domain.schemas import PaymentSummary


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
    taxes = max(int(round(total_including_taxes - accommodation)), 0)

    # Temporary deterministic mock components until payment-pricing service exists.
    fees = int(round(accommodation * 0.10))
    insurance = 20000 * max(units, 1)
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
