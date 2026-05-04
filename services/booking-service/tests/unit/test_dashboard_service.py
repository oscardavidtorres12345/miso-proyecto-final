from datetime import date
from unittest.mock import MagicMock

from src.domain.services.dashboard_service import DashboardService


def test_get_kpis_returns_zero_when_no_properties() -> None:
    svc = DashboardService()
    db = MagicMock()

    result, warnings = svc.get_kpis(
        db,
        property_ids=[],
        date_from=date(2026, 1, 1),
        date_to=date(2026, 1, 31),
        today=date(2026, 1, 15),
        target_currency="COP",
    )

    assert result.total_reservations == 0
    assert result.active_reservations == 0
    assert result.current_guests == 0
    assert result.income_total == 0
    assert warnings == []


def test_get_kpis_computes_counts_guests_and_income() -> None:
    svc = DashboardService()
    db = MagicMock()

    active_a = MagicMock()
    active_a.guest_count = 2
    active_b = MagicMock()
    active_b.guest_count = 3

    db.execute.side_effect = [
        MagicMock(scalar_one=MagicMock(return_value=5)),
        MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(all=MagicMock(return_value=[active_a, active_b]))
            )
        ),
        MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(
                    all=MagicMock(
                        return_value=[
                            '{"total": 1000, "currency":"COP"}',
                            '{"total": 2500, "currency":"USD"}',
                            "invalid-json",
                            None,
                        ]
                    )
                )
            )
        ),
    ]

    result, warnings = svc.get_kpis(
        db,
        property_ids=[10],
        date_from=date(2026, 1, 1),
        date_to=date(2026, 1, 31),
        today=date(2026, 1, 15),
        target_currency="COP",
    )

    assert result.total_reservations == 5
    assert result.active_reservations == 2
    assert result.current_guests == 5
    assert result.income_total == 3500.0
    assert warnings == []
