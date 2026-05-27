import { useCourseData } from "./CourseDataProvider";

export function TopHeader() {
  const { totals } = useCourseData();
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border-subtle bg-bg-surface">
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-semibold text-text-primary">Learn LLM</span>
        <span className="text-[13px] text-text-muted">The Hard Way</span>
      </div>
      <div className="flex items-center gap-4">
        <span
          aria-label="Concepts completed"
          className="font-mono text-[13px] text-text-muted bg-bg-elevated border border-border-subtle rounded-sm px-2 py-0.5"
        >
          {totals.completedConceptCount} / {totals.conceptCount}
        </span>
      </div>
    </header>
  );
}
