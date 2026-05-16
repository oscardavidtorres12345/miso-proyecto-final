import type { TFunction } from "i18next";
import type { PortalMonthlyReportResponseDto } from "@/services/bookingService";
import { triggerDownload } from "@/utils/triggerDownload";

function escapeCsv(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function row(values: Array<string | number>): string {
  return values.map(escapeCsv).join(",");
}

function formatIncome(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildReportCsv(
  report: PortalMonthlyReportResponseDto,
  t: TFunction,
  currency: string,
): void {
  const k = report.kpis_month;
  const lines: string[] = [];

  lines.push(row([t("portalReports.download.csvSectionKpis")]));
  lines.push(row([t("portalReports.download.xlsColIndicator"), t("portalReports.download.xlsColValue")]));
  lines.push(row([t("portalReports.kpis.totalReservations"), k.total_reservations]));
  lines.push(row([t("portalReports.kpis.cancelledReservations"), k.cancelled_reservations]));
  lines.push(row([t("portalReports.kpis.newGuests"), k.new_guests]));
  lines.push(row([t("portalReports.kpis.returningGuests"), k.returning_guests]));
  lines.push(row([t("portalReports.kpis.occupiedRooms"), k.occupied_rooms]));
  lines.push(row([t("portalReports.kpis.availableRooms"), k.available_rooms]));
  lines.push(row([t("portalReports.kpis.grossIncome", { currency }), formatIncome(k.gross_income, currency)]));
  lines.push(row([t("portalReports.kpis.netIncome", { currency }), formatIncome(k.net_income, currency)]));
  lines.push("");

  lines.push(row([t("portalReports.download.csvSectionBarsByPeriod")]));
  lines.push(row([t("portalReports.download.xlsColPeriod"), t("portalReports.download.xlsColValue")]));
  report.bars_by_period.forEach((b) => lines.push(row([b.period, b.value])));
  lines.push("");

  lines.push(row([t("portalReports.download.pdfSectionDistribution")]));
  lines.push(
    row([
      t("portalReports.download.xlsColCategory"),
      t("portalReports.download.xlsColRoomType"),
      t("portalReports.download.xlsColValue"),
      t("portalReports.download.xlsColPercentage"),
    ]),
  );
  report.distribution_by_category.forEach((d) =>
    lines.push(row([d.category, d.room_type ?? "-", d.value, d.percentage])),
  );

  if (report.additional_charts && report.additional_charts.length > 0) {
    lines.push("");
    lines.push(row([t("portalReports.download.pdfSectionAdditionalCharts")]));
    report.additional_charts.forEach((chart) => {
      lines.push("");
      lines.push(row([chart.title]));
      lines.push(
        row([
          t("portalReports.download.xlsColPeriod"),
          t("portalReports.download.xlsColValue"),
        ]),
      );
      chart.points.forEach((point) => lines.push(row([point.period, point.value])));
    });
  }

  const content = `\uFEFF${lines.join("\n")}`;
  triggerDownload(new Blob([content], { type: "text/csv;charset=utf-8" }), `reporte-mensual-${report.meta.month}.csv`);
}
