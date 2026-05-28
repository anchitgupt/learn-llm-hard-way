interface GenerationThumbProps {
  text: string;
}

export function GenerationThumb({ text }: GenerationThumbProps) {
  const truncated = text.length > 120 ? text.slice(0, 120) + "…" : text;
  return (
    <p className="font-mono text-[12px] text-text-muted whitespace-pre-wrap" data-testid="thumb-generation">
      {truncated}
    </p>
  );
}
