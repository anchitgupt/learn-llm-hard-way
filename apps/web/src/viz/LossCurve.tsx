import { useMemo } from "react";
import { line as d3Line } from "d3-shape";
import type { LossSeries } from "./data/types";
import { Axes } from "./primitives/Axes";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { categoricalColor } from "./primitives/colors";
import { linearScale } from "./primitives/scales";

export interface LossCurveProps {
  series: LossSeries[];
  steps?: number[];
  yMax?: number;
  showRollingMean?: boolean;
}

const padding = 34;
const aspect = 16 / 10;
const inner = frameInner(padding, aspect);
const axisLeft = 72;
const axisTop = 34;
const axisBottom = 72;
const axisRight = 34;

function finiteValues(series: LossSeries[]): number[] {
  return series.flatMap((item) => item.values).filter((value) => Number.isFinite(value));
}

function resolveSteps(length: number, steps?: number[]): number[] {
  if (steps?.length === length && steps.every((step) => Number.isFinite(step))) {
    return steps;
  }
  return Array.from({ length }, (_, index) => index);
}

function rollingMean(values: number[], windowSize = 3): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1).filter((value) => Number.isFinite(value));
    if (slice.length === 0) return NaN;
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

export function LossCurve({ series, steps, yMax, showRollingMean = false }: LossCurveProps) {
  const plotW = inner.width - axisLeft - axisRight;
  const plotH = inner.height - axisTop - axisBottom;
  const maxLength = Math.max(0, ...series.map((item) => item.values.length));
  const xValues = resolveSteps(maxLength, steps);
  const finiteX = xValues.filter((value) => Number.isFinite(value));
  const xMin = finiteX.length ? Math.min(...finiteX) : 0;
  const xMaxRaw = finiteX.length ? Math.max(...finiteX) : 1;
  const xMax = xMaxRaw === xMin ? xMin + 1 : xMaxRaw;
  const maxLoss = yMax ?? Math.max(1, ...finiteValues(series));
  const yTop = maxLoss === 0 ? 1 : maxLoss;
  const xScale = linearScale([xMin, xMax], [0, plotW]);
  const yScale = linearScale([0, yTop], [plotH, 0]);
  const pathLine = useMemo(
    () =>
      d3Line<[number, number]>()
        .defined(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
        .x(([x]) => xScale(x))
        .y(([, y]) => yScale(y)),
    [xScale, yScale]
  );

  const firstSeries = series[0];
  const rollingValues = showRollingMean && firstSeries ? rollingMean(firstSeries.values) : [];
  const rollingPath =
    showRollingMean && firstSeries
      ? pathLine(xValues.slice(0, firstSeries.values.length).map((step, index) => [step, rollingValues[index]]))
      : null;

  return (
    <div className="w-full" data-y-max={yMax === undefined ? undefined : String(yMax)}>
      <VizFrame
        title="Loss curve"
        description="Training and validation loss over steps."
        aspect={aspect}
        padding={padding}
      >
        <g transform={`translate(${axisLeft} ${axisTop})`}>
          <Axes xScale={xScale} yScale={yScale} width={plotW} height={plotH} xLabel="step" yLabel="loss" />

          {series.length === 0 ? (
            <text
              x={plotW / 2}
              y={plotH / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontFamily="var(--font-sans)"
              fontSize={16}
            >
              No series yet.
            </text>
          ) : null}

          {series.map((item, index) => {
            const points = xValues.slice(0, item.values.length).map(
              (step, valueIndex) => [step, item.values[valueIndex]] as [number, number]
            );
            const color = categoricalColor(index);
            return (
              <path
                key={item.label}
                data-series={item.label}
                d={pathLine(points) ?? ""}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>{item.label}</title>
              </path>
            );
          })}

          {rollingPath ? (
            <path
              data-rolling-mean
              d={rollingPath}
              fill="none"
              stroke="var(--accent-hover)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 7"
            >
              <title>{`${firstSeries.label} rolling mean`}</title>
            </path>
          ) : null}
        </g>

        <g transform={`translate(${axisLeft} 10)`}>
          {series.map((item, index) => (
            <g key={item.label} transform={`translate(${index * 116} 0)`}>
              <line x1={0} x2={18} y1={0} y2={0} stroke={categoricalColor(index)} strokeWidth={3} />
              <text
                x={26}
                y={0}
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontFamily="var(--font-sans)"
                fontSize={12}
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>
      </VizFrame>
    </div>
  );
}
