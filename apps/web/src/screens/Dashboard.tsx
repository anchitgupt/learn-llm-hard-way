import { useCourseData } from "../shell/CourseDataProvider";
import { Stagger, Reveal } from "@/lib/motion";
import { ContinueCard } from "./dashboard/ContinueCard";
import { TrackProgressGrid } from "./dashboard/TrackProgressGrid";
import { MissedTopicsPanel } from "./dashboard/MissedTopicsPanel";
import { RecentArtifactsPanel } from "./dashboard/RecentArtifactsPanel";

export function Dashboard() {
  const { tracks, missedTopics, recentArtifacts, progressRecords, continueConcept, totals, loading } =
    useCourseData();

  if (loading) {
    return <p className="text-text-muted">Loading…</p>;
  }

  return (
    <Stagger className="space-y-8">
      <Reveal>
        <header>
          <p className="text-[12px] uppercase tracking-wide text-text-muted">Today</p>
          <h1 className="text-[28px] leading-[36px] font-semibold">Welcome back.</h1>
          <p className="text-text-muted">
            {totals.completedConceptCount} of {totals.conceptCount} concepts complete
            {missedTopics.length > 0 ? <> · {missedTopics.length} missed</> : null}.
          </p>
        </header>
      </Reveal>

      <Reveal>
        <ContinueCard concept={continueConcept} tracks={tracks} />
      </Reveal>

      <Reveal>
        <TrackProgressGrid tracks={tracks} progressRecords={progressRecords} />
      </Reveal>

      <Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          <MissedTopicsPanel missedTopics={missedTopics} />
          <RecentArtifactsPanel artifacts={recentArtifacts} />
        </div>
      </Reveal>
    </Stagger>
  );
}
