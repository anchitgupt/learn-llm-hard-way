import type { GlossaryEntry } from "../types";

interface GlossaryPanelProps {
  conceptGlossaryIds: string[];
  entries: GlossaryEntry[];
}

export function GlossaryPanel({ conceptGlossaryIds, entries }: GlossaryPanelProps) {
  const allowed = new Set(conceptGlossaryIds);
  const visibleEntries = entries.filter((entry) => allowed.has(entry.id));

  return (
    <aside className="glossary-panel" aria-label="Glossary">
      <h3>Glossary</h3>
      {visibleEntries.length === 0 ? <p>No glossary terms for this concept yet.</p> : null}
      {visibleEntries.map((entry) => (
        <article key={entry.id}>
          <h4>{entry.term}</h4>
          <p>{entry.shortDefinition}</p>
        </article>
      ))}
    </aside>
  );
}
