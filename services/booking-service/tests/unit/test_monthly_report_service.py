from datetime import date
from unittest.mock import MagicMock, patch

from src.domain.services.monthly_report_service import MonthlyReportService


def test_build_report_returns_zeros_without_properties() -> None:
    svc = MonthlyReportService()
    db = MagicMock()

    kpis, distribution, bars, charts, warnings = svc.build_report(
        db,
        property_ids=[],
        period_start=date(2026, 4, 1),
        period_end=date(2026, 4, 30),
        top_n=5,
        available_rooms=10,
    )

    assert kpis.total_reservations == 0
    assert kpis.available_rooms == 0
    assert distribution == []
    assert bars == []
    assert charts == []
    assert warnings == []


def test_build_report_computes_kpis_and_charts() -> None:
    svc = MonthlyReportService()
    db = MagicMock()

    a = MagicMock()
    a.property_id = 10
    a.room_id = 1
    a.room_type = "Suite"
    a.user_id = "u1"
    a.status = "CONFIRMED"
    a.check_in = date(2026, 4, 3)
    a.payment_summary_json = '{"total": 100, "currency":"COP"}'

    b = MagicMock()
    b.property_id = 10
    b.room_id = 2
    b.room_type = "Suite"
    b.user_id = "u1"
    b.status = "CONFIRMED"
    b.check_in = date(2026, 4, 4)
    b.payment_summary_json = '{"total": 100, "currency":"EUR"}'

    c = MagicMock()
    c.property_id = 10
    c.room_id = 3
    c.room_type = "Deluxe"
    c.user_id = "u2"
    c.status = "CANCELLED"
    c.check_in = date(2026, 4, 7)
    c.payment_summary_json = '{"total": 300, "currency":"COP"}'

    db.execute.return_value.scalars.return_value.all.return_value = [a, b, c]

    with patch(
        "src.domain.services.monthly_report_service.payment_client"
    ) as mock_payment:
        mock_payment.fx_quote.return_value = {"converted_amount": 200.0}
        kpis, distribution, bars, charts, warnings = svc.build_report(
            db,
            property_ids=[10],
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            top_n=5,
            available_rooms=12,
            target_currency="USD",
        )

    assert kpis.total_reservations == 3
    assert kpis.cancelled_reservations == 1
    assert kpis.new_guests == 0
    assert kpis.returning_guests == 1
    assert kpis.occupied_rooms == 2
    assert kpis.available_rooms == 12
    assert kpis.gross_income == 400.0
    assert kpis.net_income == 340.0
    assert distribution[0].category == "Suite"
    assert bars[0].period == "2026-04-03"
    assert bars[0].value == 200.0
    assert bars[1].period == "2026-04-04"
    assert bars[1].value == 200.0
    assert len(charts) == 2
    assert charts[0].key == "occupancy_by_room_type"
    assert charts[0].title == "Ocupacion por tipo de habitacion"
    assert [p.period for p in charts[0].points] == ["Suite"]
    assert [p.value for p in charts[0].points] == [400.0]
    assert charts[1].key == "accumulated_income"
    assert charts[1].title == "Ingresos acumulados por dia"
    assert [p.value for p in charts[1].points] == [200.0, 400.0]
    assert warnings == []


def test_build_report_includes_checked_in_in_monthly_metrics() -> None:
    svc = MonthlyReportService()
    db = MagicMock()

    confirmed = MagicMock()
    confirmed.property_id = 10
    confirmed.room_id = 1
    confirmed.room_type = "Suite"
    confirmed.user_id = "u1"
    confirmed.status = "CONFIRMED"
    confirmed.check_in = date(2026, 4, 3)
    confirmed.payment_summary_json = '{"total": 150, "currency":"COP"}'

    checked_in = MagicMock()
    checked_in.property_id = 10
    checked_in.room_id = 2
    checked_in.room_type = "Deluxe"
    checked_in.user_id = "u2"
    checked_in.status = "CHECKED_IN"
    checked_in.check_in = date(2026, 4, 4)
    checked_in.payment_summary_json = '{"total": 999, "currency":"COP"}'

    db.execute.return_value.scalars.return_value.all.return_value = [
        confirmed,
        checked_in,
    ]

    kpis, distribution, bars, charts, warnings = svc.build_report(
        db,
        property_ids=[10],
        period_start=date(2026, 4, 1),
        period_end=date(2026, 4, 30),
        top_n=5,
        available_rooms=12,
        target_currency="COP",
    )

    assert kpis.total_reservations == 2
    assert kpis.new_guests == 2
    assert kpis.returning_guests == 0
    assert kpis.occupied_rooms == 2
    assert kpis.gross_income == 1149.0
    assert kpis.net_income == 976.65
    assert len(distribution) == 2
    assert {item.category for item in distribution} == {"Suite", "Deluxe"}
    assert len(bars) == 2
    assert bars[0].period == "2026-04-03"
    assert bars[0].value == 150.0
    assert bars[1].period == "2026-04-04"
    assert bars[1].value == 999.0
    assert len(charts) == 2
    assert warnings == []
