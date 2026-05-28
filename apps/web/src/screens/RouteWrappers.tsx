import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { GlossaryPanel } from "../components/GlossaryPanel";
import { ArtifactPreview } from "../components/ArtifactPreview";
import { FailureMuseum } from "../components/FailureMuseum";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";
import { fetchChatFailures } from "../api";
import type { FailureCase } from "../types";

export function TracksRoute() {
  const { tracks } = useCourseData();
  const navigate = useNavigate();
  return (
    <>
      <MigrationBanner scheduledIn={4} />
      <ul className="space-y-2 font-mono text-[14px]">
        {tracks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="underline text-accent hover:text-accent-hover"
              onClick={() => navigate(`/concepts/${t.concepts[0]?.id ?? ""}`)}
            >
              {t.title} — {t.concepts.length} concepts
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function GlossaryRoute() {
  const { glossaryEntries } = useCourseData();
  // Show all glossary entries by passing all their IDs
  const allIds = useMemo(() => glossaryEntries.map((e) => e.id), [glossaryEntries]);
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <GlossaryPanel conceptGlossaryIds={allIds} entries={glossaryEntries} />
    </>
  );
}

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
