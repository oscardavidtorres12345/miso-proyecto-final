from datetime import date
from unittest.mock import MagicMock, patch

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


def test_get_kpis_returns_zero_active_and_guests_for_past_period() -> None:
    svc = DashboardService()
    db = MagicMock()

    db.execute.side_effect = [
        MagicMock(scalar_one=MagicMock(return_value=4)),
        MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(
                    all=MagicMock(
                        return_value=[
                            '{"total": 1200, "currency":"COP"}',
                        ]
                    )
                )
            )
        ),
    ]

    result, warnings = svc.get_kpis(
        db,
        property_ids=[10],
        date_from=date(2026, 4, 1),
        date_to=date(2026, 4, 30),
        today=date(2026, 5, 18),
        target_currency="COP",
    )

    assert result.total_reservations == 4
    assert result.active_reservations == 0
    assert result.current_guests == 0
    assert result.income_total == 1200.0
    assert warnings == []


def test_get_kpis_active_and_guests_within_selected_period_cutoff() -> None:
    svc = DashboardService()
    db = MagicMock()

    active_a = MagicMock()
    active_a.guest_count = 1
    active_b = MagicMock()
    active_b.guest_count = 2

    db.execute.side_effect = [
        MagicMock(scalar_one=MagicMock(return_value=3)),
        MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(all=MagicMock(return_value=[active_a, active_b]))
            )
        ),
        MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(
                    all=MagicMock(return_value=['{"total": 500, "currency":"COP"}'])
                )
            )
        ),
    ]

    result, _ = svc.get_kpis(
        db,
        property_ids=[10],
        date_from=date(2026, 5, 1),
        date_to=date(2026, 5, 20),
        today=date(2026, 5, 18),
        target_currency="COP",
    )

    assert result.active_reservations == 2
    assert result.current_guests == 3


def test_get_time_series_groups_by_day() -> None:
    svc = DashboardService()
    db = MagicMock()

    b1 = MagicMock()
    b1.check_in = date(2026, 1, 2)
    b1.payment_summary_json = '{"total": 100, "currency":"COP"}'
    b2 = MagicMock()
    b2.check_in = date(2026, 1, 2)
    b2.payment_summary_json = '{"total": 50, "currency":"COP"}'
    b3 = MagicMock()
    b3.check_in = date(2026, 1, 3)
    b3.payment_summary_json = '{"total": 70, "currency":"COP"}'

    db.execute.return_value.scalars.return_value.all.return_value = [b1, b2, b3]

    bookings, income, warnings = svc.get_time_series(
        db,
        property_ids=[10],
        date_from=date(2026, 1, 1),
        date_to=date(2026, 1, 31),
        granularity="day",
        target_currency="COP",
    )

    assert warnings == []
    assert [p.period for p in bookings] == ["2026-01-02", "2026-01-03"]
    assert [p.value for p in bookings] == [2.0, 1.0]
    assert [p.value for p in income] == [150.0, 70.0]


def test_get_occupancy_and_ranking_with_top_n() -> None:
    svc = DashboardService()
    db = MagicMock()

    a = MagicMock()
    a.room_type = "Suite"
    a.room_id = 1
    a.property_name = "Hotel A"
    a.property_id = 10
    b = MagicMock()
    b.room_type = "Suite"
    b.room_id = 2
    b.property_name = "Hotel A"
    b.property_id = 10
    c = MagicMock()
    c.room_type = None
    c.room_id = 3
    c.property_name = "Hotel B"
    c.property_id = 11

    db.execute.return_value.scalars.return_value.all.return_value = [a, b, c]

    a.check_in = date(2026, 1, 2)
    a.check_out = date(2026, 1, 3)
    a.guest_count = 2
    b.check_in = date(2026, 1, 4)
    b.check_out = date(2026, 1, 5)
    b.guest_count = 2
    c.check_in = date(2026, 1, 6)
    c.check_out = date(2026, 1, 7)
    c.guest_count = 1

    with patch(
        "src.domain.services.dashboard_service.search_client.get_hotel_detail"
    ) as mock_hotel:
        mock_hotel.side_effect = [
            {"amenities": [{"id": "wifi"}, {"id": "pool"}]},
            {"amenities": [{"id": "wifi"}]},
        ]
        occupancy, ranking, warnings = svc.get_occupancy_and_ranking(
            db,
            property_ids=[10, 11],
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
            top_n=2,
        )

    assert occupancy[0].category == "Suite"
    assert occupancy[0].property_name == "Hotel A"
    assert occupancy[0].room_type == "Suite"
    assert occupancy[0].value == 2
    assert occupancy[1].category == "Room 3"
    assert occupancy[1].property_name == "Hotel B"
    assert occupancy[1].room_type is None
    assert occupancy[1].value == 1
    assert warnings == []
    assert len(ranking) == 2
    assert ranking[0].label == "wifi"
    assert ranking[0].value == 3
    assert ranking[1].label == "pool"
    assert ranking[1].value == 2
