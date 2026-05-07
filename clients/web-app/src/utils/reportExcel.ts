import * as XLSX from "xlsx";
import type { TFunction } from "i18next";
import type { PortalMonthlyReportResponseDto } from "@/services/bookingService";

function formatIncome(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildReportExcel(
  report: PortalMonthlyReportResponseDto,
  t: TFunction,
  currency: string,
): void {
  const wb = XLSX.utils.book_new();
  const k = report.kpis_month;

  // Sheet 1: KPIs
  const wsKpis = XLSX.utils.aoa_to_sheet([
    [t("portalReports.download.xlsColIndicator"), t("portalReports.download.xlsColValue")],
    [t("portalReports.kpis.totalReservations"), k.total_reservations],
    [t("portalReports.kpis.cancelledReservations"), k.cancelled_reservations],
    [t("portalReports.kpis.newGuests"), k.new_guests],
    [t("portalReports.kpis.returningGuests"), k.returning_guests],
    [t("portalReports.kpis.occupiedRooms"), k.occupied_rooms],
    [t("portalReports.kpis.availableRooms"), k.available_rooms],
    [t("portalReports.kpis.grossIncome", { currency }), formatIncome(k.gross_income, currency)],
    [t("portalReports.kpis.netIncome", { currency }), formatIncome(k.net_income, currency)],
  ]);
  wsKpis["!cols"] = [{ wch: 36 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsKpis, t("portalReports.download.xlsKpisSheet"));

  // Sheet 2: Distribution by category
  const wsDist = XLSX.utils.aoa_to_sheet([
    [
      t("portalReports.download.xlsColCategory"),
      t("portalReports.download.xlsColRoomType"),
      t("portalReports.download.xlsColValue"),
      t("portalReports.download.xlsColPercentage"),
    ],
    ...report.distribution_by_category.map((d) => [
      d.category,
      d.room_type ?? "",
      d.value,
      d.percentage,
    ]),
  ]);
  wsDist["!cols"] = [{ wch: 26 }, { wch: 26 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsDist, t("portalReports.download.xlsDistributionSheet"));

  // Sheet 3: Bars by period
  const wsBars = XLSX.utils.aoa_to_sheet([
    [t("portalReports.download.xlsColPeriod"), t("portalReports.download.xlsColValue")],
    ...report.bars_by_period.map((b) => [b.period, b.value]),
  ]);
  wsBars["!cols"] = [{ wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsBars, t("portalReports.download.xlsBarsByPeriodSheet"));

  // Sheets 4..N: additional charts
  report.additional_charts.forEach((chart) => {
    const wsChart = XLSX.utils.aoa_to_sheet([
      [t("portalReports.download.xlsColPeriod"), t("portalReports.download.xlsColValue")],
      ...chart.points.map((p) => [p.period, p.value]),
    ]);
    wsChart["!cols"] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsChart, chart.title.slice(0, 31));
  });

  XLSX.writeFile(wb, `reporte-mensual-${report.meta.month}.xlsx`);
}
