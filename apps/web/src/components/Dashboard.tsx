import type { Concept, LabRunArtifact, MissedTopic, Track } from "../types";

interface DashboardProps {
  tracks: Track[];
  selectedConceptId: string | null;
  missedTopics?: MissedTopic[];
  recentArtifacts?: LabRunArtifact[];
  onSelectConcept: (concept: Concept) => void;
}

export function Dashboard({
  tracks,
  selectedConceptId,
  missedTopics = [],
  recentArtifacts = [],
  onSelectConcept
}: DashboardProps) {
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
      <section className="dashboard-panel">
        <h3>Missed Topics</h3>
        {missedTopics.length === 0 ? <p>No revisit items yet.</p> : null}
        {missedTopics.map((topic) => (
          <p key={`${topic.conceptId}-${topic.reason}`}>{topic.conceptId} - {topic.reason}</p>
        ))}
      </section>
      <section className="dashboard-panel">
        <h3>Recent Artifacts</h3>
        {recentArtifacts.length === 0 ? <p>No lab artifacts yet.</p> : null}
        {recentArtifacts.map((artifact) => (
          <p key={`${artifact.labId}-${artifact.artifactPath}`}>{artifact.labId}</p>
        ))}
      </section>
    </aside>
  );
}
