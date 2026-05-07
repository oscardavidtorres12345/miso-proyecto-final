import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TFunction } from "i18next";
import type { PortalMonthlyReportResponseDto } from "@/services/bookingService";

const PRIMARY = [125, 161, 13] as const;   // #7DA10D
const SECONDARY = [33, 53, 0] as const;    // #213500
const ROW_ALT = [245, 250, 230] as const;

function formatIncome(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(...SECONDARY);
  doc.setFont("helvetica", "bold");
  doc.text(text, 14, y);
  doc.setFont("helvetica", "normal");
  return y + 4;
}

export function buildReportPdf(
  report: PortalMonthlyReportResponseDto,
  t: TFunction,
  currency: string,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Brand header bar
  doc.setFillColor(...SECONDARY);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(t("portalReports.title"), 14, 13);

  // Month + currency metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${report.meta.month}  ·  ${currency}`, 14, 19);

  doc.setTextColor(...SECONDARY);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const k = report.kpis_month;
  let cursorY = addSectionTitle(doc, t("portalReports.download.pdfSectionKpis"), 30);

  autoTable(doc, {
    startY: cursorY,
    head: [[t("portalReports.download.xlsColIndicator"), t("portalReports.download.xlsColValue")]],
    body: [
      [t("portalReports.kpis.totalReservations"), String(k.total_reservations)],
      [t("portalReports.kpis.cancelledReservations"), String(k.cancelled_reservations)],
      [t("portalReports.kpis.newGuests"), String(k.new_guests)],
      [t("portalReports.kpis.returningGuests"), String(k.returning_guests)],
      [t("portalReports.kpis.occupiedRooms"), String(k.occupied_rooms)],
      [t("portalReports.kpis.availableRooms"), String(k.available_rooms)],
      [t("portalReports.kpis.grossIncome", { currency }), formatIncome(k.gross_income, currency)],
      [t("portalReports.kpis.netIncome", { currency }), formatIncome(k.net_income, currency)],
    ],
    headStyles: { fillColor: [...PRIMARY] },
    alternateRowStyles: { fillColor: [...ROW_ALT] },
    columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  });

  // ── Distribution ───────────────────────────────────────────────────────────
  cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  cursorY = addSectionTitle(doc, t("portalReports.download.pdfSectionDistribution"), cursorY);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      t("portalReports.download.xlsColCategory"),
      t("portalReports.download.xlsColRoomType"),
      t("portalReports.download.xlsColValue"),
      t("portalReports.download.xlsColPercentage"),
    ]],
    body: report.distribution_by_category.map((d) => [
      d.category,
      d.room_type ?? "",
      String(d.value),
      `${d.percentage.toFixed(1)} %`,
    ]),
    headStyles: { fillColor: [...PRIMARY] },
    alternateRowStyles: { fillColor: [...ROW_ALT] },
    margin: { left: 14, right: 14 },
  });

  // ── Bars by period ─────────────────────────────────────────────────────────
  cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  cursorY = addSectionTitle(doc, t("portalReports.download.pdfSectionBarsByPeriod"), cursorY);

  autoTable(doc, {
    startY: cursorY,
    head: [[t("portalReports.download.xlsColPeriod"), t("portalReports.download.xlsColValue")]],
    body: report.bars_by_period.map((b) => [b.period, formatIncome(b.value, currency)]),
    headStyles: { fillColor: [...PRIMARY] },
    alternateRowStyles: { fillColor: [...ROW_ALT] },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 } },
    margin: { left: 14, right: 14 },
  });

  // ── Additional charts ──────────────────────────────────────────────────────
  if (report.additional_charts.length > 0) {
    cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    cursorY = addSectionTitle(doc, t("portalReports.download.pdfSectionAdditionalCharts"), cursorY);

    report.additional_charts.forEach((chart, idx) => {
      if (idx > 0) {
        cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      }

      doc.setFontSize(9);
      doc.setTextColor(...SECONDARY);
      doc.text(chart.title, 14, cursorY + 3);

      autoTable(doc, {
        startY: cursorY + 5,
        head: [[t("portalReports.download.xlsColPeriod"), t("portalReports.download.xlsColValue")]],
        body: chart.points.map((p) => [p.period, formatIncome(p.value, currency)]),
        headStyles: { fillColor: [...PRIMARY] },
        alternateRowStyles: { fillColor: [...ROW_ALT] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 } },
        margin: { left: 14, right: 14 },
      });
    });
  }

  doc.save(`reporte-mensual-${report.meta.month}.pdf`);
}
