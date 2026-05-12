import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, CalendarDays, FileDown, FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";
import "./PortalReports.css";
import LoadingSpinner from "@/components/LoadingSpinner";
import Snackbar from "@/components/Snackbar";
import { useAuth } from "@/context/AuthContext";
import {
  getPortalMonthlyReport,
  type PortalMonthlyReportResponseDto,
  type MonthlyReportQueryParams,
} from "@/services/bookingService";
import KpiCard from "@/components/KpiCard";
import BarChart from "@/components/BarChart";
import DonutChart from "@/components/DonutChart";
import { useReportExport } from "@/hooks/useReportExport";

type LoadState = "loading" | "ready" | "error";

const CURRENCIES: Record<string, string> = {
  COP: "COP",
  ARS: "ARS",
  USD: "USD",
};

const DEFAULT_FILTERS: MonthlyReportQueryParams = {
  month: currentMonthStr(),
  currency: CURRENCIES.COP,
  top_n: 5,
};

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatIncome(value: number, currency = CURRENCIES.COP): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIncomeCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH_NUM = NOW.getMonth() + 1;

const PortalReports = () => {
  const { t, i18n } = useTranslation();
  const { token, session } = useAuth();

  const MONTH_NAMES = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1).padStart(2, "0"),
        label: new Intl.DateTimeFormat(i18n.language, { month: "long" }).format(new Date(2000, i, 1)),
      })),
    [i18n.language],
  );

  const [report, setReport] = useState<PortalMonthlyReportResponseDto | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filters, setFilters] = useState<MonthlyReportQueryParams>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<MonthlyReportQueryParams>(DEFAULT_FILTERS);

  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "error" });

  const auth = useMemo(() => {
    const userId = session?.user.user_id;
    if (!token || !userId) return null;
    return { token, userId };
  }, [token, session?.user.user_id]);

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    setLoadState("loading");
    getPortalMonthlyReport(auth, filters)
      .then((data) => {
        if (!cancelled) {
          setReport(data);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
          setSnackbar({
            show: true,
            message: t("portalReports.loadError"),
            variant: "error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth, filters, t]);

  const handleApply = () => setFilters({ ...draft });

  const currency = filters.currency ?? CURRENCIES.COP;
  const noDataLabel = t("portalReports.charts.noData");
  const isReady = loadState === "ready";
  const { handleExportPdf, handleExportExcel, handleExportCsv, pdfLoading, excelLoading, csvLoading } = useReportExport(report, currency);

  const makeFormatPeriod = (total: number) => (period: string): string => {
    const parts = period.split("-");
    if (parts.length !== 3) return period.length > 7 ? period.slice(0, 7) : period;
    if (total <= 10) return period;
    return String(parseInt(parts[2], 10));
  };

  return (
    <div className="portal-reports flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="portal-reports__header flex flex-col gap-1">
        <h1 className="portal-reports__header-title text-2xl font-bold text-[#213500]">
          {t("portalReports.title")}
        </h1>
        <p className="portal-reports__header-subtitle text-sm text-gray-500">
          {t("portalReports.subtitle")}
        </p>
      </div>

      {/* Filter bar */}
      <div className="portal-reports__filter-bar bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="portal-reports__month-filter flex flex-col w-44 flex-shrink-0">
          <span className="text-base font-bold text-black leading-none mb-1">
            {t("portalReports.filters.month")}
          </span>
          <div className="flex items-center gap-1 w-full">
            <CalendarDays className="input-field-icon text-primary flex-shrink-0" />
            <select
              className="input-box text-base text-[#213500] focus:outline-none bg-white cursor-pointer w-full capitalize"
              value={(draft.month ?? currentMonthStr()).split("-")[1]}
              onChange={(e) =>
                setDraft((d) => ({ ...d, month: `${CURRENT_YEAR}-${e.target.value}` }))
              }
            >
              {MONTH_NAMES.map(({ value, label }) => (
                <option key={value} value={value} disabled={Number(value) > CURRENT_MONTH_NUM}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="portal-reports__currency-filter flex flex-col w-44 flex-shrink-0">
          <span className="text-base font-bold text-black leading-none mb-1">
            {t("portalReports.filters.currency")}
          </span>
          <div className="flex items-center gap-1 w-full">
            <Banknote className="input-field-icon text-primary flex-shrink-0" />
            <select
              className="input-box text-base text-[#213500] focus:outline-none bg-white cursor-pointer w-full"
              value={draft.currency ?? CURRENCIES.COP}
              onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleApply}
          aria-label={t("portalReports.filters.apply")}
          className="self-end w-10 h-10 rounded-full bg-[#7DA10D] flex items-center justify-center text-white hover:bg-[#6a8c0b] transition-colors flex-shrink-0"
        >
          <Search size={18} />
        </button>

        {/* Export buttons */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0 self-end">
          <button
            onClick={handleExportPdf}
            disabled={!isReady || pdfLoading}
            aria-label={t("portalReports.download.pdf")}
            className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-[#7DA10D] text-[#7DA10D] text-sm font-medium bg-white hover:bg-[#7DA10D]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            <span className="hidden sm:inline">
              {pdfLoading ? t("portalReports.download.exportingPdf") : t("portalReports.download.pdf")}
            </span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!isReady || excelLoading}
            aria-label={t("portalReports.download.excel")}
            className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-[#213500] text-[#213500] text-sm font-medium bg-white hover:bg-[#213500]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {excelLoading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span className="hidden sm:inline">
              {excelLoading ? t("portalReports.download.exportingExcel") : t("portalReports.download.excel")}
            </span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!isReady || csvLoading}
            aria-label={t("portalReports.download.csv")}
            className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-[#5b6f1b] text-[#5b6f1b] text-sm font-medium bg-white hover:bg-[#5b6f1b]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {csvLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            <span className="hidden sm:inline">
              {csvLoading ? t("portalReports.download.exportingCsv") : t("portalReports.download.csv")}
            </span>
          </button>
        </div>
      </div>

      {/* Warnings */}
      {report?.meta.warnings && report.meta.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 flex flex-col gap-1">
          {report.meta.warnings.map((w, i) => (
            <span key={i}>⚠ {w}</span>
          ))}
        </div>
      )}

      {/* Loading */}
      {loadState === "loading" && (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {/* Content */}
      {loadState === "ready" && report && (
        <>
          {/* KPI rows — 8 cards in 2×4 grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={t("portalReports.kpis.totalReservations")}
              value={report.kpis_month.total_reservations}
            />
            <KpiCard
              label={t("portalReports.kpis.cancelledReservations")}
              value={report.kpis_month.cancelled_reservations}
            />
            <KpiCard
              label={t("portalReports.kpis.newGuests")}
              value={report.kpis_month.new_guests}
            />
            <KpiCard
              label={t("portalReports.kpis.returningGuests")}
              value={report.kpis_month.returning_guests}
            />
            <KpiCard
              label={t("portalReports.kpis.occupiedRooms")}
              value={report.kpis_month.occupied_rooms}
            />
            <KpiCard
              label={t("portalReports.kpis.availableRooms")}
              value={report.kpis_month.available_rooms}
            />
            <KpiCard
              label={t("portalReports.kpis.grossIncome", { currency })}
              value={formatIncome(report.kpis_month.gross_income, currency)}
            />
            <KpiCard
              label={t("portalReports.kpis.netIncome", { currency })}
              value={formatIncome(report.kpis_month.net_income, currency)}
            />
          </div>

          {/* Top charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <DonutChart
                data={report.distribution_by_category}
                label={t("portalReports.charts.distributionByCategory")}
                noDataLabel={noDataLabel}
              />
            </div>
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <BarChart
                data={report.bars_by_period}
                label={t("portalReports.charts.barsByPeriod")}
                noDataLabel={noDataLabel}
                formatValue={(v) => formatIncome(v, currency)}
                formatAxisValue={(v) => formatIncomeCompact(v, i18n.language)}
                formatPeriod={makeFormatPeriod(report.bars_by_period.length)}
              />
            </div>
          </div>

          {/* Additional charts */}
          {report.additional_charts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {report.additional_charts.map((chart) => (
                <div
                  key={chart.key}
                  className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6"
                >
                  <BarChart
                    data={chart.points}
                    label={chart.title}
                    noDataLabel={noDataLabel}
                    color="#213500"
                    formatValue={(v) => formatIncome(v, currency)}
                    formatAxisValue={(v) => formatIncomeCompact(v, i18n.language)}
                    formatPeriod={makeFormatPeriod(chart.points.length)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((s) => ({ ...s, show: false }))}
      />
    </div>
  );
};

export default PortalReports;
