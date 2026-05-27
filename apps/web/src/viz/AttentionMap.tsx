import { useMemo, useState } from "react";
import type { AttentionMatrix } from "./data/types";
import { Legend } from "./primitives/Legend";
import { Tooltip } from "./primitives/Tooltip";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { magnitudeRamp, maskedColor } from "./primitives/colors";
import { bandScale } from "./primitives/scales";

export interface AttentionMapProps {
  data: AttentionMatrix;
  highlightedToken?: string | null;
  highlightedIndex?: number | null;
  showRowSums?: boolean;
}

interface CellDatum {
  key: string;
  queryToken: string;
  keyToken: string;
  rowIndex: number;
  colIndex: number;
  score: number;
  masked: boolean;
  label: string;
}

interface HoverState {
  cell: CellDatum;
  position: { x: number; y: number };
}

const padding = 32;
const aspect = 4 / 3;
const inner = frameInner(padding, aspect);
const topLabelHeight = 112;
const leftLabelWidth = 116;
const rowSumWidth = 124;
const sideGutter = 24;
const bottomGutter = 24;

function formatScore(score: number): string {
  return score.toFixed(2);
}

function rowSum(scores: number[], tokenCount: number): number {
  return scores.slice(0, tokenCount).reduce((sum, score) => (Number.isFinite(score) ? sum + score : sum), 0);
}

function validateSelfAttention(data: AttentionMatrix): void {
  const { tokens, scores } = data;
  const invalid = scores.length !== tokens.length || scores.some((row) => row.length !== tokens.length);
  if (invalid) {
    throw new Error("AttentionMap expects a square self-attention matrix: scores must be tokens.length by tokens.length.");
  }
}

function isHighlighted(cell: CellDatum, highlightedToken: string | null, highlightedIndex: number | null): boolean {
  if (highlightedIndex !== null) {
    return cell.rowIndex === highlightedIndex || cell.colIndex === highlightedIndex;
  }
  return highlightedToken !== null && (cell.queryToken === highlightedToken || cell.keyToken === highlightedToken);
}

export function AttentionMap({
  data,
  highlightedToken = null,
  highlightedIndex = null,
  showRowSums = false
}: AttentionMapProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  validateSelfAttention(data);
  const { tokens, scores } = data;
  const domain = useMemo(() => tokens.map((_, index) => String(index)), [tokens]);
  const reservedRight = showRowSums ? rowSumWidth : sideGutter;
  const gridSize = Math.max(
    0,
    Math.min(inner.width - leftLabelWidth - reservedRight, inner.height - topLabelHeight - bottomGutter)
  );
  const gridX = leftLabelWidth;
  const gridY = topLabelHeight;
  const xScale = bandScale(domain, [gridX, gridX + gridSize], 0.04);
  const yScale = bandScale(domain, [gridY, gridY + gridSize], 0.04);
  const cellSize = xScale.bandwidth();
  const maskFill = maskedColor();
  const legendItems = [
    { label: "low", swatch: magnitudeRamp(0) },
    { label: "mid", swatch: magnitudeRamp(0.5) },
    { label: "high", swatch: magnitudeRamp(1) },
    { label: "masked", swatch: maskFill }
  ];

  const cells = useMemo<CellDatum[]>(
    () =>
      tokens.flatMap((queryToken, rowIndex) =>
        tokens.map((keyToken, colIndex) => {
          const score = scores[rowIndex]?.[colIndex] ?? -Infinity;
          const masked = !Number.isFinite(score);
          const label = masked
            ? `${queryToken} -> ${keyToken}: masked`
            : `${queryToken} -> ${keyToken}: ${formatScore(score)}`;
          return {
            key: `${rowIndex}-${colIndex}`,
            queryToken,
            keyToken,
            rowIndex,
            colIndex,
            score,
            masked,
            label
          };
        })
      ),
    [scores, tokens]
  );

  return (
    <div className="w-full">
      <VizFrame
        title="Attention map"
        description="Token-to-token attention scores. Masked positions are shown separately from numeric scores."
        aspect={aspect}
        padding={padding}
      >
        <g aria-label="Attention score grid">
          <text
            x={gridX + gridSize / 2}
            y={28}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Keys
          </text>
          <text
            transform={`translate(22 ${gridY + gridSize / 2}) rotate(-90)`}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Queries
          </text>

          {domain.map((id, index) => {
            const x = xScale(id) ?? gridX;
            return (
              <text
                key={`col-${id}`}
                transform={`translate(${x + cellSize / 2} ${gridY - 16}) rotate(-45)`}
                textAnchor="start"
                dominantBaseline="middle"
                fill={tokens[index] === highlightedToken ? "var(--accent)" : "var(--text-muted)"}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fontWeight={tokens[index] === highlightedToken ? 700 : 500}
              >
                {tokens[index]}
              </text>
            );
          })}

          {domain.map((id, index) => {
            const y = yScale(id) ?? gridY;
            return (
              <text
                key={`row-${id}`}
                x={gridX - 14}
                y={y + cellSize / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill={tokens[index] === highlightedToken ? "var(--accent)" : "var(--text-muted)"}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fontWeight={tokens[index] === highlightedToken ? 700 : 500}
              >
                {tokens[index]}
              </text>
            );
          })}

          <rect
            x={gridX}
            y={gridY}
            width={gridSize}
            height={gridSize}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={1}
            rx={6}
          />

          {cells.map((cell) => {
            const x = xScale(String(cell.colIndex)) ?? gridX;
            const y = yScale(String(cell.rowIndex)) ?? gridY;
            const highlighted = isHighlighted(cell, highlightedToken, highlightedIndex);
            return (
              <g key={cell.key}>
                <rect
                  data-cell
                  data-masked={cell.masked ? "true" : undefined}
                  data-highlighted={highlighted ? "true" : undefined}
                  aria-label={cell.label}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={4}
                  fill={cell.masked ? maskFill : magnitudeRamp(cell.score)}
                  stroke={highlighted ? "var(--accent)" : "var(--bg-base)"}
                  strokeWidth={highlighted ? 3 : 1}
                  onMouseMove={(event) => setHover({ cell, position: { x: event.clientX, y: event.clientY } })}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{cell.label}</title>
                </rect>
                {cell.masked ? (
                  <path
                    aria-hidden="true"
                    d={`M ${x + 6} ${y + cellSize - 6} L ${x + cellSize - 6} ${y + 6}`}
                    stroke="var(--bg-base)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.75}
                    style={{ pointerEvents: "none" }}
                  />
                ) : null}
              </g>
            );
          })}

          {showRowSums
            ? domain.map((id, index) => {
                const y = yScale(id) ?? gridY;
                const sum = rowSum(scores[index] ?? [], tokens.length);
                return (
                  <g
                    key={`row-sum-${id}`}
                    data-row-sum
                    aria-label={`${tokens[index]} attention row sum: ${formatScore(sum)}`}
                    transform={`translate(${gridX + gridSize + 28} ${y + cellSize / 2})`}
                  >
                    <line x1={-12} x2={0} stroke="var(--border-subtle)" strokeWidth={1} />
                    <text
                      x={10}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-mono)"
                      fontSize={12}
                    >
                      {formatScore(sum)}
                    </text>
                  </g>
                );
              })
            : null}
        </g>
      </VizFrame>

      <Legend items={legendItems} title="Attention" className="mt-3" />
      {hover ? (
        <Tooltip position={hover.position}>
          <div className="flex flex-col gap-1">
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {hover.cell.queryToken}
              {" -> "}
              {hover.cell.keyToken}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {hover.cell.masked ? "masked" : formatScore(hover.cell.score)}
            </span>
          </div>
        </Tooltip>
      ) : null}
    </div>
  );
}
