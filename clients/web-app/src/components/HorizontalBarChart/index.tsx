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

const LABEL_W = 170;
const RIGHT_PAD = 50;
const VIEW_W = 600;
const MARGIN_V = 12;
const LINE_H = 14;
const BASE_ROW_PAD = 16;
const MIN_ROW_H = 36;
const LABEL_CHARS = 22;
const TOOLTIP_W = 180;
const TOOLTIP_CHARS = 26;
const TOOLTIP_LINE_H = 14;
const TOOLTIP_PAD_Y = 10;
const TOOLTIP_VALUE_GAP = 6;

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

interface RowData {
  item: HBarItem;
  lines: string[];
  rowH: number;
  y: number;
}

function buildRows(data: HBarItem[]): { rows: RowData[]; totalH: number } {
  const rows: RowData[] = [];
  let currentY = MARGIN_V;
  for (const item of data) {
    const lines = splitText(item.label, LABEL_CHARS);
    const rowH = Math.max(MIN_ROW_H, lines.length * LINE_H + BASE_ROW_PAD);
    rows.push({ item, lines, rowH, y: currentY });
    currentY += rowH;
  }
  return { rows, totalH: currentY + MARGIN_V };
}

const HorizontalBarChart = ({
  data,
  label,
  color = "#7DA10D",
  formatValue,
  noDataLabel = "Sin datos",
}: HorizontalBarChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { rows, totalH } = buildRows(data);
  const barAreaW = VIEW_W - LABEL_W - RIGHT_PAD;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getTooltipX = (barCenterX: number, tooltipW: number) => {
    const preferred = barCenterX - tooltipW / 2;
    if (preferred + tooltipW > VIEW_W - 4) return VIEW_W - tooltipW - 4;
    if (preferred < 4) return 4;
    return preferred;
  };

  return (
    <div className="horizontal-bar-chart flex flex-col w-full h-full">
      <div className="horizontal-bar-chart__header self-start">
        {label && <p className="text-sm font-semibold text-[#213500] mb-3">{label}</p>}
      </div>
      <div className="horizontal-bar-chart__body flex-1 flex items-center justify-center w-full">
        <svg
        viewBox={`0 0 ${VIEW_W} ${totalH}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={label}
        onMouseLeave={() => setActiveIndex(null)}
      >
        {data.length === 0 ? (
          <text
            x={VIEW_W / 2}
            y={totalH / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#9ca3af"
          >
            {noDataLabel}
          </text>
        ) : (
          <>
            {rows.map(({ item, lines, rowH, y }, i) => {
              const barW = Math.max(
                (item.value / maxValue) * barAreaW,
                item.value > 0 ? 2 : 0
              );
              const displayVal = formatValue
                ? formatValue(item.value)
                : String(item.value);
              const isActive = activeIndex === i;
              const textBlockH = lines.length * LINE_H;
              const textStartY = y + rowH / 2 - textBlockH / 2 + LINE_H - 2;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={0} y={y} width={VIEW_W} height={rowH} fill="transparent" />
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={LABEL_W - 8}
                      y={textStartY + li * LINE_H}
                      textAnchor="end"
                      fontSize="11"
                      fill="#374151"
                    >
                      {line}
                    </text>
                  ))}
                  <rect
                    data-testid="bar-rect"
                    x={LABEL_W}
                    y={y + (rowH - (MIN_ROW_H - BASE_ROW_PAD)) / 2}
                    width={barW}
                    height={MIN_ROW_H - BASE_ROW_PAD}
                    fill={color}
                    fillOpacity={isActive ? 0.75 : 1}
                    rx="3"
                  />
                  <text
                    x={LABEL_W + barW + 6}
                    y={y + rowH / 2 + 4}
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {displayVal}
                  </text>
                </g>
              );
            })}

            {activeIndex !== null &&
              (() => {
                const { item, y } = rows[activeIndex];
                const barW = Math.max(
                  (item.value / maxValue) * barAreaW,
                  item.value > 0 ? 2 : 0
                );
                const barCenterX = LABEL_W + barW / 2;
                const tooltipLines = splitText(item.label, TOOLTIP_CHARS);
                const displayVal = formatValue
                  ? formatValue(item.value)
                  : String(item.value);
                const tooltipH =
                  TOOLTIP_PAD_Y * 2 +
                  tooltipLines.length * TOOLTIP_LINE_H +
                  TOOLTIP_VALUE_GAP +
                  TOOLTIP_LINE_H;
                const tx = getTooltipX(barCenterX, TOOLTIP_W);
                const ty = Math.max(y - tooltipH - 4, MARGIN_V);

                return (
                  <g data-testid="chart-tooltip" style={{ pointerEvents: "none" }}>
                    <rect
                      x={tx}
                      y={ty}
                      width={TOOLTIP_W}
                      height={tooltipH}
                      rx="6"
                      fill="#213500"
                      fillOpacity="0.92"
                    />
                    {tooltipLines.map((line, li) => (
                      <text
                        key={li}
                        x={tx + TOOLTIP_W / 2}
                        y={ty + TOOLTIP_PAD_Y + (li + 1) * TOOLTIP_LINE_H}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#d9f99d"
                        fontWeight="600"
                      >
                        {line}
                      </text>
                    ))}
                    <text
                      x={tx + TOOLTIP_W / 2}
                      y={
                        ty +
                        TOOLTIP_PAD_Y +
                        tooltipLines.length * TOOLTIP_LINE_H +
                        TOOLTIP_VALUE_GAP +
                        TOOLTIP_LINE_H
                      }
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
    </div>
  );
};

export default HorizontalBarChart;
