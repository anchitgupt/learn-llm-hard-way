import type { Concept, Track } from "../types";

interface DashboardProps {
  tracks: Track[];
  selectedConceptId: string | null;
  onSelectConcept: (concept: Concept) => void;
}

export function Dashboard({ tracks, selectedConceptId, onSelectConcept }: DashboardProps) {
  return (
    <aside className="dashboard" aria-label="Learning tracks">
      <h2>Mission Path</h2>
      {tracks.map((track) => (
        <section key={track.id}>
          <h3>{track.title}</h3>
          <p>{track.summary}</p>
          <div className="concept-list">
            {track.concepts.map((concept) => (
              <button
                key={concept.id}
                className={concept.id === selectedConceptId ? "selected" : ""}
                type="button"
                onClick={() => onSelectConcept(concept)}
              >
                {concept.title}
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
