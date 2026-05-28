import { useCourseData } from "../shell/CourseDataProvider";
import { useGlossaryFilter } from "./glossary/useGlossaryFilter";
import { GlossarySearch } from "./glossary/GlossarySearch";
import { GlossaryGrid } from "./glossary/GlossaryGrid";

export function Glossary() {
  const { glossaryEntries } = useCourseData();
  const { query, setQuery, filtered } = useGlossaryFilter(glossaryEntries);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Reference</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Glossary</h1>
        <p className="text-text-muted">Search every term you've encountered.</p>
      </header>
      <GlossarySearch
        query={query}
        total={glossaryEntries.length}
        shown={filtered.length}
        onChange={setQuery}
      />
      <GlossaryGrid entries={filtered} query={query} />
    </div>
  );
}
