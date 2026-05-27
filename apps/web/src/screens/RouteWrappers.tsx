import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ConceptMap } from "../components/ConceptMap";
import { ConceptWorkspace } from "../components/ConceptWorkspace";
import { ChatPlayground } from "../components/ChatPlayground";
import { GlossaryPanel } from "../components/GlossaryPanel";
import { ArtifactPreview } from "../components/ArtifactPreview";
import { FailureMuseum } from "../components/FailureMuseum";
import { MigrationBanner } from "../shell/MigrationBanner";
import { useCourseData } from "../shell/CourseDataProvider";
import { fetchChatFailures, runLab, submitCheckpoint, touchConcept } from "../api";
import type { FailureCase } from "../types";

// Concept IDs that show the Chat Playground inline (preserving the pre-routing behaviour)
const chatConceptIds = new Set([
  "message-formatting",
  "tokenization-trace",
  "context-window-trace",
  "sampling-streaming",
  "base-vs-assistant-chat",
  "scratch-work",
  "tool-verification",
  "chat-memory",
  "failure-museum",
  "preference-rlhf"
]);

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

export function ConceptMapRoute() {
  const { tracks, missedTopics } = useCourseData();
  const navigate = useNavigate();
  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((m) => m.conceptId)),
    [missedTopics]
  );
  return (
    <>
      <MigrationBanner scheduledIn={5} />
      <ConceptMap
        tracks={tracks}
        selectedConceptId={null}
        missedConceptIds={missedConceptIds}
        onSelectConcept={(concept) => navigate(`/concepts/${concept.id}`)}
      />
    </>
  );
}

export function ConceptRoute() {
  const { id } = useParams<{ id: string }>();
  const { tracks, glossaryEntries, missedTopics, refresh } = useCourseData();

  useEffect(() => {
    if (!id) return;
    void touchConcept(id).catch(() => { /* best-effort */ });
  }, [id]);

  const concept = useMemo(() => {
    for (const t of tracks) for (const c of t.concepts) if (c.id === id) return c;
    return null;
  }, [tracks, id]);

  if (!concept) {
    return (
      <>
        <MigrationBanner scheduledIn={4} />
        <p>Concept not found.</p>
      </>
    );
  }
  return (
    <>
      <MigrationBanner scheduledIn={4} />
      <ConceptWorkspace
        concept={concept}
        glossaryEntries={glossaryEntries}
        onSubmitCheckpoint={async (conceptId, input) => {
          const attempt = await submitCheckpoint(conceptId, input);
          await refresh();
          return attempt;
        }}
        onRunLab={async (labId) => {
          const artifact = await runLab(labId);
          await refresh();
          return artifact;
        }}
      />
      {chatConceptIds.has(concept.id) ? <ChatPlayground /> : null}
      {missedTopics.length > 0 ? (
        <aside className="dashboard-panel">
          <h3>Missed Topics</h3>
          {missedTopics.map((topic) => (
            <p key={`${topic.conceptId}-${topic.reason}`}>{topic.conceptId} - {topic.reason}</p>
          ))}
        </aside>
      ) : null}
    </>
  );
}

export function ChatRoute() {
  return (
    <>
      <MigrationBanner scheduledIn={6} />
      <ChatPlayground />
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
