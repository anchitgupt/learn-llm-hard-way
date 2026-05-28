import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { GlossaryEntry } from "../../types";

export function useGlossaryFilter(entries: GlossaryEntry[]) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      (e.term + " " + e.shortDefinition + " " + e.explanation).toLowerCase().includes(q)
    );
  }, [entries, query]);

  const setQuery = (next: string) => {
    const merged = new URLSearchParams(params);
    if (next.trim()) merged.set("q", next);
    else merged.delete("q");
    setParams(merged, { replace: true });
  };

  return { query, setQuery, filtered };
}
