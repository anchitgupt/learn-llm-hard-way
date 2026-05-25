import { useState } from "react";
import type { LabRunArtifact } from "../types";

interface LabPanelProps {
  labId: string | null;
  onRun: (labId: string) => Promise<LabRunArtifact>;
}

export function LabPanel({ labId, onRun }: LabPanelProps) {
  const [artifact, setArtifact] = useState<LabRunArtifact | null>(null);

  async function handleRun() {
    if (!labId) return;
    setArtifact(await onRun(labId));
  }

  if (!labId) {
    return <p>No lab for this concept yet.</p>;
  }

  return (
    <section className="lab-panel">
      <h3>Lab</h3>
      <p>{labId}</p>
      <button type="button" onClick={handleRun}>Run lab</button>
      {artifact ? <p role="status">{artifact.artifactPath}</p> : null}
    </section>
  );
}
