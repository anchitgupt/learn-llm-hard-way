interface GlossarySearchProps {
  query: string;
  total: number;
  shown: number;
  onChange: (next: string) => void;
}

export function GlossarySearch({ query, total, shown, onChange }: GlossarySearchProps) {
  return (
    <div className="space-y-1">
      <input
        type="search"
        role="searchbox"
        aria-label="search terms"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search terms…"
        className="w-full rounded-md border border-border-subtle bg-bg-inset px-3 py-2 text-[14px]"
      />
      <p className="text-[12px] text-text-muted">
        Showing {shown} of {total} terms
      </p>
    </div>
  );
}
