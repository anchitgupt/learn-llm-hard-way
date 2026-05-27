import { useEffect, useMemo, useState } from "react";
import {
  fetchGlossary,
  fetchMissedTopics,
  fetchRecentArtifacts,
  fetchTracks,
  runLab,
  submitCheckpoint
} from "./api";
import { ConceptWorkspace } from "./components/ConceptWorkspace";
import { ConceptMap } from "./components/ConceptMap";
import { Dashboard } from "./components/Dashboard";
import { ChatPlayground } from "./components/ChatPlayground";
import type { Concept, GlossaryEntry, LabRunArtifact, MissedTopic, Track } from "./types";

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

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);
  const [recentArtifacts, setRecentArtifacts] = useState<LabRunArtifact[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTracks(), fetchGlossary(), fetchMissedTopics(), fetchRecentArtifacts()])
      .then(([loadedTracks, loadedGlossary, loadedMissedTopics, loadedArtifacts]) => {
        setTracks(loadedTracks);
        setGlossaryEntries(loadedGlossary);
        setMissedTopics(loadedMissedTopics);
        setRecentArtifacts(loadedArtifacts);
        setSelectedConcept(loadedTracks[0]?.concepts[0] ?? null);
      })
      .catch((unknownError: unknown) => {
        setError(unknownError instanceof Error ? unknownError.message : "Unknown error");
      });
  }, []);

  const conceptCount = useMemo(
    () => tracks.reduce((total, track) => total + track.concepts.length, 0),
    [tracks]
  );

  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((topic) => topic.conceptId)),
    [missedTopics]
  );

  async function handleRunLab(labId: string) {
    const artifact = await runLab(labId);
    setRecentArtifacts((current) => [
      artifact,
      ...current.filter((item) => item.artifactPath !== artifact.artifactPath)
    ]);
    return artifact;
  }

  async function handleSubmitCheckpoint(
    conceptId: string,
    input: { submittedAnswer: string; confidence: number }
  ) {
    const attempt = await submitCheckpoint(conceptId, input);
    setMissedTopics(await fetchMissedTopics());
    return attempt;
  }

  return (
    <div className="app-shell">
      <header>
        <p className="eyebrow">Local-first LLM curriculum</p>
        <h1>Learn LLM The Hard Way</h1>
        <p>{conceptCount} foundation concepts loaded.</p>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <div className="main-layout">
        <Dashboard
          tracks={tracks}
          selectedConceptId={selectedConcept?.id ?? null}
          missedTopics={missedTopics}
          recentArtifacts={recentArtifacts}
          onSelectConcept={setSelectedConcept}
        />
        <div className="learning-column">
          <ConceptMap
            tracks={tracks}
            selectedConceptId={selectedConcept?.id ?? null}
            missedConceptIds={missedConceptIds}
            onSelectConcept={setSelectedConcept}
          />
          {selectedConcept ? (
            <>
              <ConceptWorkspace
                concept={selectedConcept}
                glossaryEntries={glossaryEntries}
                onSubmitCheckpoint={handleSubmitCheckpoint}
                onRunLab={handleRunLab}
              />
              {chatConceptIds.has(selectedConcept.id) ? <ChatPlayground /> : null}
            </>
          ) : (
            <p>Loading curriculum...</p>
          )}
        </div>
      </div>
    </div>
  );
}
