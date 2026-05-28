interface TrackProgressProps {
  completed: number;
  total: number;
  percent: number;
}

export function TrackProgress({ completed, total, percent }: TrackProgressProps) {
  return (
    <div className="space-y-1">
      <div className="h-1 w-full overflow-hidden rounded bg-bg-inset">
        <div
          className="h-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
          data-testid="track-progress-bar"
        />
      </div>
      <p className="text-[12px] text-text-muted">
        {completed} / {total} concepts complete
      </p>
    </div>
  );
}
