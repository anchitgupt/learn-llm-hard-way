import { useMemo } from "react";
import type { EmbeddingPoint } from "./data/types";
import { Axes } from "./primitives/Axes";
import { Legend } from "./primitives/Legend";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { categoricalColor } from "./primitives/colors";
import { linearScale } from "./primitives/scales";

export interface EmbeddingSpaceProps {
  points: EmbeddingPoint[];
  selectedId?: string;
  showClusters?: boolean;
}

const padding = 34;
const aspect = 16 / 10;
const inner = frameInner(padding, aspect);
const axisLeft = 72;
const axisTop = 34;
const axisBottom = 72;
const axisRight = 34;
const singlePointFill = "var(--accent)";

function finiteExtent(values: number[]): [number, number] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return [0, 1];

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [min - 1, max + 1];

  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}

function uniqueClusters(points: EmbeddingPoint[]): string[] {
  return Array.from(
    new Set(points.map((point) => point.cluster).filter((cluster): cluster is string => Boolean(cluster)))
  );
}

export function EmbeddingSpace({ points, selectedId, showClusters }: EmbeddingSpaceProps) {
  const plotW = inner.width - axisLeft - axisRight;
  const plotH = inner.height - axisTop - axisBottom;
  const clusters = useMemo(() => uniqueClusters(points), [points]);
  const clusteringActive = showClusters !== false && clusters.length > 0;
  const clusterColors = useMemo(
    () => new Map(clusters.map((cluster, index) => [cluster, categoricalColor(index)])),
    [clusters]
  );
  const xScale = linearScale(finiteExtent(points.map((point) => point.x)), [0, plotW]);
  const yScale = linearScale(finiteExtent(points.map((point) => point.y)), [plotH, 0]);
  const legendItems = clusters.map((cluster) => ({
    label: cluster,
    swatch: clusterColors.get(cluster) ?? singlePointFill
  }));

  return (
    <div className="w-full">
      <VizFrame
        title="Embedding space"
        description="A two-dimensional projection of embedding points."
        aspect={aspect}
        padding={padding}
      >
        <g transform={`translate(${axisLeft} ${axisTop})`}>
          <Axes
            xScale={xScale}
            yScale={yScale}
            width={plotW}
            height={plotH}
            xLabel="dimension 1"
            yLabel="dimension 2"
          />

          {points.length === 0 ? (
            <text
              x={plotW / 2}
              y={plotH / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontFamily="var(--font-sans)"
              fontSize={16}
            >
              No embeddings yet.
            </text>
          ) : null}

          {points.map((point) => {
            const selected = selectedId !== undefined && point.id === selectedId;
            const fill =
              clusteringActive && point.cluster ? clusterColors.get(point.cluster) ?? singlePointFill : singlePointFill;
            return (
              <g key={point.id}>
                <circle
                  data-point
                  data-id={point.id}
                  data-cluster={point.cluster ?? ""}
                  data-selected={selected ? "true" : "false"}
                  cx={xScale(point.x)}
                  cy={yScale(point.y)}
                  r={selected ? 7 : 5.5}
                  fill={fill}
                  stroke={selected ? "var(--accent-hover)" : "var(--bg-base)"}
                  strokeWidth={selected ? 4 : 1.5}
                >
                  <title>{point.label ?? point.id}</title>
                </circle>
                {point.label ? (
                  <text
                    x={xScale(point.x) + 10}
                    y={yScale(point.y) - 10}
                    fill={selected ? "var(--accent)" : "var(--text-muted)"}
                    fontFamily="var(--font-mono)"
                    fontSize={11}
                    fontWeight={selected ? 700 : 500}
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </VizFrame>

      {clusteringActive ? <Legend items={legendItems} title="Cluster" className="mt-3" /> : null}
    </div>
  );
}
