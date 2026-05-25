import { useEffect, useMemo, useState } from "react";
import { fetchTracks } from "./api";
import { ConceptWorkspace } from "./components/ConceptWorkspace";
import { Dashboard } from "./components/Dashboard";
import type { Concept, Track } from "./types";

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks()
      .then((loadedTracks) => {
        setTracks(loadedTracks);
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
          onSelectConcept={setSelectedConcept}
        />
        {selectedConcept ? <ConceptWorkspace concept={selectedConcept} /> : <p>Loading curriculum...</p>}
      </div>
    </div>
  );
}
