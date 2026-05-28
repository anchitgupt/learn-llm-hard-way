interface ComparisonThumbProps {
  base?: string;
  assistant?: string;
}

export function ComparisonThumb({ base, assistant }: ComparisonThumbProps) {
  return (
    <div className="space-y-1 text-[12px] font-mono" data-testid="thumb-comparison">
      {base ? <p><span className="text-text-muted">base:</span> {base}</p> : null}
      {assistant ? <p><span className="text-text-muted">assistant:</span> {assistant}</p> : null}
    </div>
  );
}
