import { Stagger, Reveal } from "@/lib/motion";
import { TermCard } from "./TermCard";
import type { GlossaryEntry } from "../../types";

interface GlossaryGridProps {
  entries: GlossaryEntry[];
  query: string;
}

export function GlossaryGrid({ entries, query }: GlossaryGridProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-text-muted py-12">
        No terms match <span className="font-mono">"{query}"</span>.
      </p>
    );
  }
  return (
    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((e) => (
        <Reveal key={e.id}>
          <TermCard entry={e} />
        </Reveal>
      ))}
    </Stagger>
  );
}
