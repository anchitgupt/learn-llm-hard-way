import type { Concept, Track } from "../types";

interface ConceptMapProps {
  tracks: Track[];
  selectedConceptId: string | null;
  missedConceptIds: Set<string>;
  onSelectConcept: (concept: Concept) => void;
}

export function ConceptMap({ tracks, selectedConceptId, missedConceptIds, onSelectConcept }: ConceptMapProps) {
  const concepts = tracks.flatMap((track) => track.concepts.map((concept) => ({ ...concept, trackTitle: track.title })));
  const titleById = new Map(concepts.map((concept) => [concept.id, concept.title]));

  return (
    <section className="concept-map" aria-label="Concept map">
      <h2>Concept Map</h2>
      <div className="concept-map-grid">
        {concepts.map((concept) => {
          const missed = missedConceptIds.has(concept.id);
          return (
            <button
              key={concept.id}
              type="button"
              className={concept.id === selectedConceptId ? "concept-node selected" : "concept-node"}
              aria-label={missed ? `${concept.title} revisit needed` : concept.title}
              data-missed={missed}
              onClick={() => onSelectConcept(concept)}
            >
              <span>{concept.title}</span>
              <small>{concept.trackTitle}</small>
            </button>
          );
        })}
      </div>
      <div className="prerequisite-list" aria-label="Prerequisite edges">
        {concepts.flatMap((concept) =>
          concept.prerequisites.map((prerequisite) => (
            <p key={`${prerequisite}-${concept.id}`}>
              {titleById.get(prerequisite) ?? prerequisite} -&gt; {concept.title}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
