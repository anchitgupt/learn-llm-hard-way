import type { PreferenceSimulation } from "../types";

interface PreferencePanelProps {
  simulation: PreferenceSimulation | null;
}

export function PreferencePanel({ simulation }: PreferencePanelProps) {
  if (!simulation) {
    return (
      <section className="preference-panel">
        <h3>Preference Simulation</h3>
        <p>No preference simulation loaded.</p>
      </section>
    );
  }

  return (
    <section className="preference-panel">
      <h3>Preference Simulation</h3>
      <p>{simulation.prompt}</p>
      <p>Winner: {simulation.winner.id}</p>
      <div className="reward-list">
        {Object.entries(simulation.rewardScores).map(([id, score]) => (
          <p key={id}>
            {id}: {score}
          </p>
        ))}
      </div>
      <p>{simulation.explanation}</p>
    </section>
  );
}
