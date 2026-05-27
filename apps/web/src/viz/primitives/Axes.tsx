import type { ScaleLinear } from "d3-scale";

export interface AxesProps {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  xTicks?: number;
  yTicks?: number;
  xLabel?: string;
  yLabel?: string;
}

function nice(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1000 || abs < 0.01) return value.toExponential(1);
  if (abs < 10) return Number(value.toFixed(2)).toString();
  if (abs < 100) return Number(value.toFixed(1)).toString();
  return Math.round(value).toString();
}

export function Axes({ xScale, yScale, width, height, xTicks = 5, yTicks = 5, xLabel, yLabel }: AxesProps) {
  const xTickValues = xTicks <= 0 ? [] : xScale.ticks(xTicks);
  const yTickValues = yTicks <= 0 ? [] : yScale.ticks(yTicks);
  const stroke = "var(--border-strong)";
  const mutedStroke = "var(--border-subtle)";
  const fill = "var(--text-muted)";
  const labelFill = "var(--text-primary)";

  return (
    <g aria-hidden="true">
      <g data-axis="x" transform={`translate(0 ${height})`}>
        <line x1={0} x2={width} y1={0} y2={0} stroke={stroke} strokeWidth={1} />
        {xTickValues.map((tick) => {
          const x = xScale(tick);
          return (
            <g key={tick} data-tick transform={`translate(${x} 0)`}>
              <line y1={0} y2={6} stroke={stroke} strokeWidth={1} />
              <text
                y={18}
                textAnchor="middle"
                fill={fill}
                fontFamily="var(--font-mono)"
                fontSize={11}
                dominantBaseline="hanging"
              >
                {nice(tick)}
              </text>
            </g>
          );
        })}
        {xLabel ? (
          <text
            x={width / 2}
            y={40}
            textAnchor="middle"
            fill={labelFill}
            fontFamily="var(--font-sans)"
            fontSize={12}
          >
            {xLabel}
          </text>
        ) : null}
      </g>

      <g data-axis="y">
        <line x1={0} x2={0} y1={0} y2={height} stroke={stroke} strokeWidth={1} />
        {yTickValues.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick} data-tick transform={`translate(0 ${y})`}>
              <line x1={-6} x2={0} stroke={stroke} strokeWidth={1} />
              <line x1={0} x2={width} stroke={mutedStroke} strokeWidth={1} strokeDasharray="3 5" opacity={0.55} />
              <text
                x={-10}
                textAnchor="end"
                fill={fill}
                fontFamily="var(--font-mono)"
                fontSize={11}
                dominantBaseline="middle"
              >
                {nice(tick)}
              </text>
            </g>
          );
        })}
        {yLabel ? (
          <text
            transform={`translate(-44 ${height / 2}) rotate(-90)`}
            textAnchor="middle"
            fill={labelFill}
            fontFamily="var(--font-sans)"
            fontSize={12}
          >
            {yLabel}
          </text>
        ) : null}
      </g>
    </g>
  );
}
