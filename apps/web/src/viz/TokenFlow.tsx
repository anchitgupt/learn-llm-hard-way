import { useMemo } from "react";
import type { TokenItem } from "./data/types";
import { VizFrame, frameInner } from "./primitives/VizFrame";
import { bandScale } from "./primitives/scales";

export type Stage = "text" | "tokens" | "ids" | "bytes";

export interface TokenFlowProps {
  tokens: TokenItem[];
  stages?: Stage[];
  highlightId?: TokenItem["id"];
}

const defaultStages: Stage[] = ["text", "tokens", "ids"];
const padding = 28;
const aspect = 16 / 9;
const inner = frameInner(padding, aspect);
const stageLabelWidth = 116;
const topGutter = 36;
const rowHeight = 86;
const rowGap = 14;

function stageLabel(stage: Stage): string {
  if (stage === "ids") return "ids";
  return stage;
}

function tokenValue(token: TokenItem, stage: Stage): string {
  if (stage === "text") return token.text;
  if (stage === "tokens") return token.text;
  if (stage === "ids") return String(token.id);
  return token.bytes?.length ? token.bytes.join(" ") : "-";
}

function truncateValue(value: string, maxLength = 16): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function cellLabel(token: TokenItem, stage: Stage): string {
  return `${stageLabel(stage)} ${token.text}: ${tokenValue(token, stage)}`;
}

export function TokenFlow({ tokens, stages = defaultStages, highlightId }: TokenFlowProps) {
  const effectiveStages = useMemo(() => {
    const hasBytes = tokens.some((token) => token.bytes?.length);
    return stages.filter((stage) => stage !== "bytes" || hasBytes);
  }, [stages, tokens]);

  const tokenDomain = useMemo(() => tokens.map((_, index) => String(index)), [tokens]);
  const stageDomain = useMemo(() => effectiveStages.map((stage) => stage), [effectiveStages]);
  const chartX = stageLabelWidth;
  const chartY = topGutter;
  const chartW = inner.width - stageLabelWidth - 18;
  const chartH = Math.max(
    rowHeight,
    effectiveStages.length * rowHeight + Math.max(0, effectiveStages.length - 1) * rowGap
  );
  const xScale = bandScale(tokenDomain, [chartX, chartX + chartW], 0.12);
  const yScale = bandScale(stageDomain, [chartY, chartY + chartH], 0.16);
  const cellW = xScale.bandwidth();
  const cellH = yScale.bandwidth();

  if (tokens.length === 0) {
    return (
      <VizFrame
        title="Token flow"
        description="Text tokens moving through tokenizer stages."
        aspect={aspect}
        padding={padding}
      >
        <text
          x={inner.width / 2}
          y={inner.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          fontFamily="var(--font-sans)"
          fontSize={18}
        >
          No tokens yet.
        </text>
      </VizFrame>
    );
  }

  return (
    <VizFrame
      title="Token flow"
      description="Token text, token pieces, ids, and optional bytes shown across tokenizer stages."
      aspect={aspect}
      padding={padding}
    >
      {effectiveStages.map((stage) => {
        const y = yScale(stage) ?? chartY;
        return (
          <g key={stage} data-stage={stage} aria-label={`${stageLabel(stage)} stage`}>
            <text
              x={stageLabelWidth - 18}
              y={y + cellH / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--text-primary)"
              fontFamily="var(--font-sans)"
              fontSize={13}
              fontWeight={700}
            >
              {stageLabel(stage)}
            </text>
            <line
              x1={stageLabelWidth - 6}
              x2={chartX + chartW}
              y1={y + cellH / 2}
              y2={y + cellH / 2}
              stroke="var(--border-subtle)"
              strokeWidth={1}
              strokeDasharray="4 8"
            />

            {tokens.map((token, index) => {
              const x = xScale(String(index)) ?? chartX;
              const highlighted = highlightId !== undefined && token.id === highlightId;
              const value = tokenValue(token, stage);
              const visibleValue = truncateValue(value, stage === "bytes" ? 14 : 16);
              return (
                <g key={`${stage}-${token.id}-${index}`} data-token-cell aria-label={cellLabel(token, stage)}>
                  <rect
                    x={x}
                    y={y}
                    width={cellW}
                    height={cellH}
                    rx={7}
                    fill={highlighted ? "var(--accent-quiet)" : "var(--bg-elevated)"}
                    stroke={highlighted ? "var(--accent)" : "var(--border)"}
                    strokeWidth={highlighted ? 2 : 1}
                  >
                    <title>{cellLabel(token, stage)}</title>
                  </rect>
                  <text
                    data-token-value
                    data-visible-value={visibleValue}
                    x={x + cellW / 2}
                    y={y + cellH / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={highlighted ? "var(--accent)" : "var(--text-primary)"}
                    fontFamily={stage === "text" || stage === "tokens" ? "var(--font-sans)" : "var(--font-mono)"}
                    fontSize={stage === "bytes" ? 12 : 14}
                    fontWeight={highlighted ? 700 : 600}
                  >
                    <title>{value}</title>
                    {visibleValue}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </VizFrame>
  );
}
