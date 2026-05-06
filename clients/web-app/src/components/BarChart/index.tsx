import { useState } from "react";
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
const TOOLTIP_W = 130;
const TOOLTIP_H = 40;

const BarChart = ({
  noDataLabel = "Sin datos",
  data,
  label,
  height = 220,
  color = "#7DA10D",
  formatValue,
}: BarChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const getTooltipX = (barCenterX: number) => {
    const preferred = barCenterX - TOOLTIP_W / 2;
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
          <>
            {data.map((d, i) => {
              const barH = Math.max((d.value / maxValue) * plotH, d.value > 0 ? 2 : 0);
              const x = MARGIN.left + i * slotW + (slotW - barW) / 2;
              const y = MARGIN.top + plotH - barH;
              const periodLabel = d.period.length > 7 ? d.period.slice(0, 7) : d.period;
              const isActive = activeIndex === i;
              return (
                <g
                  key={i}
                  data-testid="bar-item"
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Invisible wider hit area */}
                  <rect
                    x={MARGIN.left + i * slotW}
                    y={MARGIN.top}
                    width={slotW}
                    height={plotH}
                    fill="transparent"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={color}
                    fillOpacity={isActive ? 0.75 : 1}
                    rx="3"
                  />
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
            })}

            {/* Tooltip */}
            {activeIndex !== null && (() => {
              const d = data[activeIndex];
              const x = MARGIN.left + activeIndex * slotW + (slotW - barW) / 2;
              const barCenterX = x + barW / 2;
              const barH = Math.max((d.value / maxValue) * plotH, d.value > 0 ? 2 : 0);
              const barTopY = MARGIN.top + plotH - barH;
              const tx = getTooltipX(barCenterX);
              const ty = Math.max(barTopY - TOOLTIP_H - 8, MARGIN.top);
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
                    y={ty + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#d9f99d"
                    fontWeight="600"
                  >
                    {d.period}
                  </text>
                  <text
                    x={tx + TOOLTIP_W / 2}
                    y={ty + 29}
                    textAnchor="middle"
                    fontSize="11"
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

export default BarChart;
