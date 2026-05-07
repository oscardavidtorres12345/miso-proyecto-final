import { useState } from "react";
import type { MonthlyReportDistributionItemDto } from "@/services/bookingService";

interface DonutChartProps {
  data: MonthlyReportDistributionItemDto[];
  label?: string;
  noDataLabel?: string;
}

const COLORS = ["#7DA10D", "#213500", "#b5cc6a", "#4a6c00", "#d4e59e", "#8db520", "#163800"];
const RADIUS = 68;
const CX = 90;
const CY = 90;
const STROKE_WIDTH = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart = ({ data, label, noDataLabel = "Sin datos" }: DonutChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  let cumulativeOffset = 0;

  return (
    <div>
      {label && <p className="text-sm font-semibold text-[#213500] mb-3">{label}</p>}
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{noDataLabel}</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-2/5 lg:w-1/3 flex-shrink-0">
            <svg
              viewBox="0 0 180 180"
              width="100%"
              preserveAspectRatio="xMidYMid meet"
              aria-label={label}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={STROKE_WIDTH}
              />
              <g transform={`rotate(-90 ${CX} ${CY})`}>
                {data.map((item, i) => {
                  const dash = (item.percentage / 100) * CIRCUMFERENCE;
                  const offset = cumulativeOffset;
                  cumulativeOffset += dash;
                  const isActive = activeIndex === i;
                  return (
                    <circle
                      key={i}
                      cx={CX}
                      cy={CY}
                      r={RADIUS}
                      fill="none"
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={isActive ? STROKE_WIDTH + 6 : STROKE_WIDTH}
                      strokeOpacity={activeIndex !== null && !isActive ? 0.45 : 1}
                      strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
                      strokeDashoffset={-offset}
                      style={{ cursor: "pointer", transition: "stroke-width 0.15s ease, stroke-opacity 0.15s ease" }}
                      onMouseEnter={() => setActiveIndex(i)}
                      data-testid="donut-arc"
                    />
                  );
                })}
              </g>

              {/* Center tooltip */}
              {activeIndex !== null && (
                <g data-testid="chart-tooltip" style={{ pointerEvents: "none" }}>
                  <text
                    x={CX}
                    y={CY - 7}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#213500"
                    fontWeight="600"
                  >
                    {data[activeIndex].category.length > 13
                      ? `${data[activeIndex].category.slice(0, 13)}…`
                      : data[activeIndex].category}
                  </text>
                  <text
                    x={CX}
                    y={CY + 13}
                    textAnchor="middle"
                    fontSize="17"
                    fill={COLORS[activeIndex % COLORS.length]}
                    fontWeight="700"
                  >
                    {data[activeIndex].percentage.toFixed(1)}%
                  </text>
                </g>
              )}
            </svg>
          </div>

          <ul className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:w-auto">
            {data.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-[#213500] cursor-pointer"
                style={{ opacity: activeIndex !== null && activeIndex !== i ? 0.45 : 1, transition: "opacity 0.15s ease" }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                  data-testid="donut-legend-dot"
                />
                <span className="truncate">
                  {item.category}
                  {item.room_type ? ` (${item.room_type})` : ""}
                </span>
                <span className="text-gray-500 ml-auto flex-shrink-0">
                  {item.percentage.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
