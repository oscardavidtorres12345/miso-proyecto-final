import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, BookOpen, BedDouble, TrendingUp } from "lucide-react";
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

type LoadState = "loading" | "ready" | "error";

function formatIncome(value: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const defaultFilters: DashboardQueryParams = {
  granularity: "month",
  currency: "COP",
  top_n: 10,
};

const PortalDashboard = () => {
  const { t } = useTranslation();
  const { token, session } = useAuth();

  const [dashboard, setDashboard] = useState<PortalDashboardResponseDto | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filters, setFilters] = useState<DashboardQueryParams>(defaultFilters);
  const [draft, setDraft] = useState<DashboardQueryParams>(defaultFilters);
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

  const handleApply = () => setFilters({ ...draft });

  const currency = filters.currency ?? "COP";
  const noDataLabel = t("portalDashboard.charts.noData");

  const granularityOptions: { value: DashboardQueryParams["granularity"]; label: string }[] = [
    { value: "day", label: t("portalDashboard.filters.day") },
    { value: "week", label: t("portalDashboard.filters.week") },
    { value: "month", label: t("portalDashboard.filters.month") },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#213500]">{t("portalDashboard.title")}</h1>
        <p className="text-sm text-gray-500">{t("portalDashboard.subtitle")}</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#7DA10D]/20 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            {t("portalDashboard.filters.from")}
          </label>
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#213500] focus:outline-none focus:ring-2 focus:ring-[#7DA10D]/40"
            value={draft.date_from ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, date_from: e.target.value || undefined }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            {t("portalDashboard.filters.to")}
          </label>
          <input
            type="date"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#213500] focus:outline-none focus:ring-2 focus:ring-[#7DA10D]/40"
            value={draft.date_to ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, date_to: e.target.value || undefined }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            {t("portalDashboard.filters.granularity")}
          </label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#213500] focus:outline-none focus:ring-2 focus:ring-[#7DA10D]/40"
            value={draft.granularity ?? "month"}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                granularity: e.target.value as DashboardQueryParams["granularity"],
              }))
            }
          >
            {granularityOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            {t("portalDashboard.filters.currency")}
          </label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#213500] focus:outline-none focus:ring-2 focus:ring-[#7DA10D]/40"
            value={draft.currency ?? "COP"}
            onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
          >
            {["COP", "ARS", "USD"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleApply}
          className="px-5 py-2 rounded-lg bg-[#7DA10D] text-white text-sm font-semibold hover:bg-[#6a8c0b] transition-colors"
        >
          {t("portalDashboard.filters.apply")}
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
              icon={<BookOpen size={16} />}
            />
            <KpiCard
              label={t("portalDashboard.kpis.activeReservations")}
              value={dashboard.kpis.active_reservations}
              icon={<BedDouble size={16} />}
            />
            <KpiCard
              label={t("portalDashboard.kpis.currentGuests")}
              value={dashboard.kpis.current_guests}
              icon={<Users size={16} />}
            />
            <KpiCard
              label={t("portalDashboard.kpis.income", { currency })}
              value={formatIncome(dashboard.kpis.income_total, currency)}
              icon={<TrendingUp size={16} />}
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
