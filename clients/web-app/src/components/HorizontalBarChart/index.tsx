import { useState } from "react";

interface HBarItem {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: HBarItem[];
  label?: string;
  color?: string;
  formatValue?: (v: number) => string;
  noDataLabel?: string;
}

const ROW_H = 36;
const LABEL_W = 170;
const RIGHT_PAD = 50;
const VIEW_W = 600;
const MARGIN_V = 12;
const TOOLTIP_W = 160;
const TOOLTIP_H = 40;

const HorizontalBarChart = ({
  data,
  label,
  color = "#7DA10D",
  formatValue,
  noDataLabel = "Sin datos",
}: HorizontalBarChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const barAreaW = VIEW_W - LABEL_W - RIGHT_PAD;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const svgH = data.length * ROW_H + MARGIN_V * 2;

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
        viewBox={`0 0 ${VIEW_W} ${svgH}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={label}
        onMouseLeave={() => setActiveIndex(null)}
      >
        {data.length === 0 ? (
          <text
            x={VIEW_W / 2}
            y={svgH / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#9ca3af"
          >
            {noDataLabel}
          </text>
        ) : (
          <>
            {data.map((d, i) => {
              const y = MARGIN_V + i * ROW_H;
              const barW = Math.max((d.value / maxValue) * barAreaW, d.value > 0 ? 2 : 0);
              const shortLabel =
                d.label.length > 22 ? d.label.slice(0, 21) + "…" : d.label;
              const displayVal = formatValue ? formatValue(d.value) : String(d.value);
              const isActive = activeIndex === i;
              return (
                <g
                  key={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={0} y={y} width={VIEW_W} height={ROW_H} fill="transparent" />
                  <text
                    x={LABEL_W - 8}
                    y={y + ROW_H / 2 + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#374151"
                  >
                    {shortLabel}
                  </text>
                  <rect
                    data-testid="bar-rect"
                    x={LABEL_W}
                    y={y + 6}
                    width={barW}
                    height={ROW_H - 12}
                    fill={color}
                    fillOpacity={isActive ? 0.75 : 1}
                    rx="3"
                  />
                  <text
                    x={LABEL_W + barW + 6}
                    y={y + ROW_H / 2 + 4}
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {displayVal}
                  </text>
                </g>
              );
            })}

            {activeIndex !== null && (() => {
              const d = data[activeIndex];
              const y = MARGIN_V + activeIndex * ROW_H;
              const barW = Math.max((d.value / maxValue) * barAreaW, d.value > 0 ? 2 : 0);
              const barCenterX = LABEL_W + barW / 2;
              const tx = getTooltipX(barCenterX);
              const ty = Math.max(y - TOOLTIP_H - 4, MARGIN_V);
              const displayVal = formatValue ? formatValue(d.value) : String(d.value);
              const tooltipLabel = d.label.length > 20 ? d.label.slice(0, 19) + "…" : d.label;
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
                    {tooltipLabel}
                  </text>
                  <text
                    x={tx + TOOLTIP_W / 2}
                    y={ty + 29}
                    textAnchor="middle"
                    fontSize="11"
                    fill="white"
                  >
                    {displayVal}
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

export default HorizontalBarChart;
