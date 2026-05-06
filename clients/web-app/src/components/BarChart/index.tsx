import type { PeriodValueItemDto } from "@/services/bookingService";

interface BarChartProps {
  data: PeriodValueItemDto[];
  label?: string;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  noDataLabel?: string;
}

const MARGIN = { top: 20, right: 16, bottom: 44, left: 44 };
const VIEW_W = 600;

const BarChart = ({
  noDataLabel = "Sin datos",
  data,
  label,
  height = 220,
  color = "#7DA10D",
  formatValue,
}: BarChartProps) => {
  const plotW = VIEW_W - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slotW = n > 0 ? plotW / n : plotW;
  const barW = Math.max(slotW * 0.6, 4);

  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: MARGIN.top + plotH * (1 - ratio),
    value: maxValue * ratio,
  }));

  return (
    <div>
      {label && <p className="text-sm font-semibold text-[#213500] mb-3">{label}</p>}
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={label}
      >
        {/* Gridlines */}
        {gridLines.map(({ y, value }) => (
          <g key={y}>
            <line
              x1={MARGIN.left}
              y1={y}
              x2={MARGIN.left + plotW}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={MARGIN.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9ca3af"
            >
              {formatValue ? formatValue(value) : Math.round(value)}
            </text>
          </g>
        ))}

        {/* Y-axis */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + plotH}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        {/* X-axis */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + plotH}
          x2={MARGIN.left + plotW}
          y2={MARGIN.top + plotH}
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {n === 0 ? (
          <text
            x={VIEW_W / 2}
            y={height / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#9ca3af"
          >
            {noDataLabel}
          </text>
        ) : (
          data.map((d, i) => {
            const barH = Math.max((d.value / maxValue) * plotH, d.value > 0 ? 2 : 0);
            const x = MARGIN.left + i * slotW + (slotW - barW) / 2;
            const y = MARGIN.top + plotH - barH;
            const periodLabel = d.period.length > 7 ? d.period.slice(0, 7) : d.period;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} fill={color} rx="3" />
                <text
                  x={x + barW / 2}
                  y={MARGIN.top + plotH + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {periodLabel}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};

export default BarChart;
