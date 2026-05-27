import { Dashboard as LegacyDashboard } from "../components/Dashboard";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";

export function LegacyDashboardRoute() {
  const { tracks, missedTopics, recentArtifacts, continueConcept } = useCourseData();
  return (
    <>
      <MigrationBanner scheduledIn={2} note="Dashboard is being rebuilt in this same sub-project (Task 3)." />
      <LegacyDashboard
        tracks={tracks}
        selectedConceptId={continueConcept?.id ?? null}
        missedTopics={missedTopics}
        recentArtifacts={recentArtifacts}
        onSelectConcept={() => { /* navigation happens in Task 3 */ }}
      />
    </>
  );
}
