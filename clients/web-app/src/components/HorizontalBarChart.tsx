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

const HorizontalBarChart = ({
  data,
  label,
  color = "#7DA10D",
  formatValue,
  noDataLabel = "Sin datos",
}: HorizontalBarChartProps) => {
  const barAreaW = VIEW_W - LABEL_W - RIGHT_PAD;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const svgH = data.length * ROW_H + MARGIN_V * 2;

  return (
    <div>
      {label && <p className="text-sm font-semibold text-[#213500] mb-3">{label}</p>}
      <svg
        viewBox={`0 0 ${VIEW_W} ${svgH}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-label={label}
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
          data.map((d, i) => {
            const y = MARGIN_V + i * ROW_H;
            const barW = Math.max((d.value / maxValue) * barAreaW, d.value > 0 ? 2 : 0);
            const shortLabel =
              d.label.length > 22 ? d.label.slice(0, 21) + "…" : d.label;
            const displayVal = formatValue ? formatValue(d.value) : String(d.value);
            return (
              <g key={i}>
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
                  x={LABEL_W}
                  y={y + 6}
                  width={barW}
                  height={ROW_H - 12}
                  fill={color}
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
          })
        )}
      </svg>
    </div>
  );
};

export default HorizontalBarChart;
