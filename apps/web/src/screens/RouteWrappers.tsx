import { useEffect, useState } from "react";
import { ArtifactPreview } from "../components/ArtifactPreview";
import { FailureMuseum } from "../components/FailureMuseum";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";
import { fetchChatFailures } from "../api";
import type { FailureCase } from "../types";

export function ArtifactsRoute() {
  const { recentArtifacts } = useCourseData();
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <ul className="space-y-1 font-mono text-[13px]">
        {recentArtifacts.map((a) => (
          <li key={a.artifactPath}>
            {a.labId} — <ArtifactPreview artifact={a.artifact} />
          </li>
        ))}
        {recentArtifacts.length === 0 ? <li>No artifacts yet.</li> : null}
      </ul>
    </>
  );
}

export function FailuresRoute() {
  const [cases, setCases] = useState<FailureCase[]>([]);
  useEffect(() => {
    void fetchChatFailures().then(setCases).catch(() => { /* best-effort */ });
  }, []);
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <FailureMuseum cases={cases} />
    </>
  );
}
