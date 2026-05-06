import type { PeriodValueItemDto } from "@/services/bookingService";

interface LineChartProps {
  data: PeriodValueItemDto[];
  label?: string;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  noDataLabel?: string;
}

const MARGIN = { top: 20, right: 16, bottom: 44, left: 54 };
const VIEW_W = 600;

const LineChart = ({
  data,
  label,
  height = 220,
  color = "#7DA10D",
  formatValue,
  noDataLabel = "Sin datos",
}: LineChartProps) => {
  const plotW = VIEW_W - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;

  const toPoint = (i: number, value: number) => ({
    x: n > 1 ? MARGIN.left + (i / (n - 1)) * plotW : MARGIN.left + plotW / 2,
    y: MARGIN.top + plotH - (value / maxValue) * plotH,
  });

  const points = data.map((d, i) => toPoint(i, d.value));

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaStr =
    n > 0
      ? `${points[0].x},${MARGIN.top + plotH} ` +
        polylineStr +
        ` ${points[n - 1].x},${MARGIN.top + plotH}`
      : "";

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
              fontSize="10"
              fill="#9ca3af"
            >
              {formatValue ? formatValue(value) : Math.round(value)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + plotH}
          stroke="#d1d5db"
          strokeWidth="1"
        />
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
          <>
            {/* Area fill */}
            {n > 1 && (
              <polygon points={areaStr} fill={color} fillOpacity="0.12" />
            )}

            {/* Line */}
            {n > 1 && (
              <polyline
                points={polylineStr}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Dots + X labels */}
            {points.map((p, i) => {
              const periodLabel =
                data[i].period.length > 7
                  ? data[i].period.slice(0, 7)
                  : data[i].period;
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
                  <text
                    x={p.x}
                    y={MARGIN.top + plotH + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {periodLabel}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
};

export default LineChart;
