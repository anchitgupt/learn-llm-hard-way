interface LossThumbProps {
  history: number[];
}

export function LossThumb({ history }: LossThumbProps) {
  if (history.length === 0) return null;
  const w = 144, h = 56, pad = 4;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(history.length - 1, 1);
  const points = history
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} data-testid="thumb-loss" aria-label="loss preview">
      <polyline fill="none" stroke="rgb(34, 211, 238)" strokeWidth={1.5} points={points} />
    </svg>
  );
}
