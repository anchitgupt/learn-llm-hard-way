import { useMemo } from "react";
import { Axes } from "./primitives/Axes";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { bandScale, linearScale } from "./primitives/scales";

export interface Candidate {
  token: string;
  probability: number;
  id?: number | string;
}

export interface SamplingPlotProps {
  candidates: Candidate[];
  selectedToken?: string;
  topK?: number;
  temperature?: number;
}

const padding = 32;
const aspect = 16 / 10;
const inner = frameInner(padding, aspect);
const axisLeft = 88;
const axisTop = 44;
const axisBottom = 74;
const axisRight = 28;

function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

function truncateLabel(value: string, maxLength = 9): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export function SamplingPlot({ candidates, selectedToken, topK = 20, temperature }: SamplingPlotProps) {
  const visible = useMemo(
    () =>
      [...candidates]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, Math.max(0, topK)),
    [candidates, topK]
  );

  const plotW = inner.width - axisLeft - axisRight;
  const plotH = inner.height - axisTop - axisBottom;
  const yDomain = visible.map((_, index) => String(index));
  const yScale = bandScale(yDomain, [0, plotH], 0.2);
  const maxProbability = Math.max(1, ...visible.map((candidate) => candidate.probability));
  const xScale = linearScale([0, maxProbability], [0, plotW]);
  const yAxisScale = linearScale([0, Math.max(1, visible.length)], [0, plotH]);

  return (
    <VizFrame
      title="Sampling plot"
      description="Candidate next-token probabilities sorted by likelihood."
      aspect={aspect}
      padding={padding}
    >
      <g transform={`translate(${axisLeft} ${axisTop})`}>
        <Axes
          xScale={xScale}
          yScale={yAxisScale}
          width={plotW}
          height={plotH}
          xTicks={5}
          yTicks={0}
          xLabel="probability"
        />

        {visible.length === 0 ? (
          <text
            x={plotW / 2}
            y={plotH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--text-muted)"
            fontFamily="var(--font-sans)"
            fontSize={16}
          >
            No candidates yet.
          </text>
        ) : null}

        {visible.map((candidate, index) => {
          const y = yScale(String(index)) ?? 0;
          const barH = yScale.bandwidth();
          const width = Math.max(0, xScale(candidate.probability) - xScale(0));
          const selected = candidate.token === selectedToken;
          const probabilityLabelInside = width > plotW - 48;
          return (
            <g
              key={candidate.id ?? `${candidate.token}-${index}`}
              data-bar
              data-token={candidate.token}
              data-selected={selected ? "true" : undefined}
              transform={`translate(0 ${y})`}
            >
              <text
                data-token-label
                data-visible-label={truncateLabel(candidate.token)}
                x={-14}
                y={barH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill={selected ? "var(--accent)" : "var(--text-muted)"}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fontWeight={selected ? 700 : 500}
              >
                <title>{candidate.token}</title>
                {truncateLabel(candidate.token)}
              </text>
              <rect
                x={0}
                y={0}
                width={width}
                height={barH}
                rx={6}
                fill={selected ? "var(--accent)" : "var(--bg-elevated)"}
                stroke={selected ? "var(--accent-hover)" : "var(--border)"}
                strokeWidth={selected ? 2 : 1}
              >
                <title>{`${candidate.token}: ${formatProbability(candidate.probability)}`}</title>
              </rect>
              <text
                data-probability-label
                x={probabilityLabelInside ? plotW - 8 : Math.min(plotW - 4, width + 10)}
                y={barH / 2}
                textAnchor={probabilityLabelInside ? "end" : "start"}
                dominantBaseline="middle"
                fill="var(--text-primary)"
                fontFamily="var(--font-mono)"
                fontSize={12}
              >
                {formatProbability(candidate.probability)}
              </text>
            </g>
          );
        })}
      </g>

      {temperature !== undefined ? (
        <text
          x={inner.width - 6}
          y={22}
          textAnchor="end"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          fontSize={12}
        >
          temperature {temperature}
        </text>
      ) : null}
    </VizFrame>
  );
}
