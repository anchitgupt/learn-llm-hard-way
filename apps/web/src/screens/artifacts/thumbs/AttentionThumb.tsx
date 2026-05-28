interface AttentionThumbProps {
  weights: number[][];
}

export function AttentionThumb({ weights }: AttentionThumbProps) {
  const rows = weights.length;
  const cols = weights[0]?.length ?? 0;
  const cell = 96 / Math.max(rows, cols, 1);
  return (
    <svg width={96} height={96} data-testid="thumb-attention" aria-label="attention preview">
      {weights.map((row, r) =>
        row.map((w, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            fill={`rgba(34, 211, 238, ${Math.max(0.05, Math.min(1, Number(w) || 0))})`}
          />
        ))
      )}
    </svg>
  );
}
