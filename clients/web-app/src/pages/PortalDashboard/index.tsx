import { useEffect, useMemo, useState } from "react";
import { subMonths, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { useTranslation } from "react-i18next";
import { Banknote, Search } from "lucide-react";
import "./PortalDashboard.css";
import LoadingSpinner from "@/components/LoadingSpinner";
import Snackbar from "@/components/Snackbar";
import { useAuth } from "@/context/AuthContext";
import {
  getPortalDashboard,
  type PortalDashboardResponseDto,
  type DashboardQueryParams,
} from "@/services/bookingService";
import KpiCard from "@/components/KpiCard";
import BarChart from "@/components/BarChart";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import LineChart from "@/components/LineChart";
import DateRangeInput from "@/components/DateRangeInput";
import { type DateRange } from "@/components/DateRangePicker";

type LoadState = "loading" | "ready" | "error";

const CURRENCIES: Record<string, string> = {
  COP: "COP",
  ARS: "ARS",
  USD: "USD",
};

const DEFAULT_FILTERS: DashboardQueryParams = {
  date_from: dateToIso(startOfWeek(new Date(), { weekStartsOn: 1 })),
  date_to: dateToIso(endOfWeek(new Date(), { weekStartsOn: 1 })),
  currency: CURRENCIES.COP,
  top_n: 10,
};

function formatIncome(value: number, currency = CURRENCIES.COP): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function dateToIso(d?: Date): string | undefined {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

const PortalDashboard = () => {
  const { t } = useTranslation();
  const { token, session } = useAuth();

  const [dashboard, setDashboard] = useState<PortalDashboardResponseDto | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filters, setFilters] = useState<DashboardQueryParams>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<DashboardQueryParams>(DEFAULT_FILTERS);

  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const range = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    return range;
  });

  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "error" });

  const twoMonthsAgo = useMemo(() => startOfDay(subMonths(new Date(), 2)), []);
  
  const auth = useMemo(() => {
    const userId = session?.user.user_id;
    if (!token || !userId) return null;
    return { token, userId };
  }, [token, session?.user.user_id]);

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    setLoadState("loading");
    getPortalDashboard(auth, filters)
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
          setSnackbar({
            show: true,
            message: t("portalDashboard.loadError"),
            variant: "error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth, filters, t]);

  const handleApply = () =>
    setFilters({
      ...draft,
      date_from: dateToIso(draftDateRange?.from),
      date_to: draftDateRange?.to ? dateToIso(draftDateRange.to) : dateToIso(draftDateRange?.from),
    });

  const currency = filters.currency ?? CURRENCIES.COP;
  const noDataLabel = t("portalDashboard.charts.noData");

  return (
    <div className="portal-dashboard flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="portal-dashboard__header flex flex-col gap-1">
        <h1 className="portal-dashboard__header-title text-2xl font-bold text-[#213500]">{t("portalDashboard.title")}</h1>
        <p className="portal-dashboard__header-subtitle text-sm text-gray-500">{t("portalDashboard.subtitle")}</p>
      </div>

      {/* Filter bar */}
      <div className="portal-dashboard__filter-bar bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="portal-dashboard__date-filter">
          <DateRangeInput value={draftDateRange} onChange={setDraftDateRange} minDate={twoMonthsAgo} />
        </div>
<div className="portal-dashboard_selector-filter flex flex-col w-44 flex-shrink-0">
          <span className="portal-dashboard_selector-filter__label text-base font-bold text-black leading-none mb-1">
            {t("portalDashboard.filters.currency")}
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
          aria-label={t("portalDashboard.filters.apply")}
          className="self-end w-10 h-10 rounded-full bg-[#7DA10D] flex items-center justify-center text-white hover:bg-[#6a8c0b] transition-colors flex-shrink-0"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Warnings */}
      {dashboard?.meta.warnings && dashboard.meta.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 flex flex-col gap-1">
          {dashboard.meta.warnings.map((w, i) => (
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
      {loadState === "ready" && dashboard && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={t("portalDashboard.kpis.totalReservations")}
              value={dashboard.kpis.total_reservations}
            />
            <KpiCard
              label={t("portalDashboard.kpis.activeReservations")}
              value={dashboard.kpis.active_reservations}
            />
            <KpiCard
              label={t("portalDashboard.kpis.currentGuests")}
              value={dashboard.kpis.current_guests}
            />
            <KpiCard
              label={t("portalDashboard.kpis.income", { currency })}
              value={formatIncome(dashboard.kpis.income_total, currency)}
            />
          </div>

          {/* Charts 2×2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <BarChart
                data={dashboard.bookings_by_period}
                label={t("portalDashboard.charts.bookingsByPeriod")}
                noDataLabel={noDataLabel}
              />
            </div>
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <LineChart
                data={dashboard.income_trend}
                label={t("portalDashboard.charts.incomeTrend")}
                noDataLabel={noDataLabel}
                formatValue={(v) => formatIncome(v, currency)}
              />
            </div>
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <HorizontalBarChart
                data={dashboard.ranking.map((r) => ({
                  label: r.room_type ? `${r.label} (${r.room_type})` : r.label,
                  value: r.value,
                }))}
                label={t("portalDashboard.charts.ranking")}
                noDataLabel={noDataLabel}
              />
            </div>
            <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-6">
              <HorizontalBarChart
                data={dashboard.occupancy_by_category.map((o) => ({
                  label: o.room_type ? `${o.category} · ${o.room_type}` : o.category,
                  value: o.value,
                }))}
                label={t("portalDashboard.charts.occupancyByCategory")}
                noDataLabel={noDataLabel}
                color="#213500"
              />
            </div>
          </div>
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

export default PortalDashboard;
