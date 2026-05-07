import { useState } from "react";
import type { PeriodValueItemDto } from "@/services/bookingService";

interface LineChartProps {
  data: PeriodValueItemDto[];
  label?: string;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  formatPeriod?: (period: string) => string;
  noDataLabel?: string;
}

const MARGIN = { top: 20, right: 16, bottom: 50, left: 60 };
const VIEW_W = 600;
const TOOLTIP_W = 160;
const TOOLTIP_H = 52;

const LineChart = ({
  data,
  label,
  height = 220,
  color = "#7DA10D",
  formatValue,
  formatPeriod,
  noDataLabel = "Sin datos",
}: LineChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const getTooltipX = (cx: number) => {
    const preferred = cx - TOOLTIP_W / 2;
    if (preferred + TOOLTIP_W > VIEW_W - 4) return VIEW_W - TOOLTIP_W - 4;
    if (preferred < 4) return 4;
    return preferred;
  };

  return (
    <div>
      {label && <p className="text-sm font-semibold text-[#213500] mb-3">{label}</p>}
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={label}
        onMouseLeave={() => setActiveIndex(null)}
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
              const periodLabel = formatPeriod
                ? formatPeriod(data[i].period)
                : data[i].period.length > 7
                  ? data[i].period.slice(0, 7)
                  : data[i].period;
              const isActive = activeIndex === i;
              return (
                <g
                  key={i}
                  data-testid="point-item"
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Invisible wider hit area */}
                  <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 5.5 : 3.5}
                    fill={color}
                    stroke={isActive ? "white" : "none"}
                    strokeWidth={isActive ? 1.5 : 0}
                  />
                  <text
                    x={p.x}
                    y={MARGIN.top + plotH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {periodLabel}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {activeIndex !== null && (() => {
              const d = data[activeIndex];
              const p = points[activeIndex];
              const tx = getTooltipX(p.x);
              const ty = Math.max(p.y - TOOLTIP_H - 12, MARGIN.top);
              const valueLabel = formatValue ? formatValue(d.value) : String(d.value);
              return (
                <g data-testid="chart-tooltip" style={{ pointerEvents: "none" }}>
                  <rect
                    x={tx}
                    y={ty}
                    width={TOOLTIP_W}
                    height={TOOLTIP_H}
                    rx="6"
                    fill="#213500"
                    fillOpacity="0.92"
                  />
                  <text
                    x={tx + TOOLTIP_W / 2}
                    y={ty + 18}
                    textAnchor="middle"
                    fontSize="15"
                    fill="#d9f99d"
                    fontWeight="600"
                  >
                    {d.period}
                  </text>
                  <text
                    x={tx + TOOLTIP_W / 2}
                    y={ty + 37}
                    textAnchor="middle"
                    fontSize="15"
                    fill="white"
                  >
                    {valueLabel}
                  </text>
                </g>
              );
            })()}
          </>
        )}
      </svg>
    </div>
  );
};

export default LineChart;
