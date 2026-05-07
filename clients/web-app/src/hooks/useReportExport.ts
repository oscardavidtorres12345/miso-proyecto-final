import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalMonthlyReportResponseDto } from "@/services/bookingService";

export function useReportExport(
  report: PortalMonthlyReportResponseDto | null,
  currency: string,
) {
  const { t } = useTranslation();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const { buildReportPdf } = await import("@/utils/reportPdf");
      buildReportPdf(report, t, currency);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    setExcelLoading(true);
    try {
      const { buildReportExcel } = await import("@/utils/reportExcel");
      buildReportExcel(report, t, currency);
    } finally {
      setExcelLoading(false);
    }
  };

  return { handleExportPdf, handleExportExcel, pdfLoading, excelLoading };
}
