import { useState } from "react";
import { saveProgress } from "../api";

interface ProgressPanelProps {
  conceptId: string;
}

export function ProgressPanel({ conceptId }: ProgressPanelProps) {
  const [note, setNote] = useState("");
  const [revisit, setRevisit] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await saveProgress(conceptId, {
      status: revisit ? "confusing" : "in-progress",
      confidence: revisit ? 2 : 3,
      note,
      revisit
    });
    setSaved(true);
  }

  return (
    <section className="progress-panel" aria-label="Learning state">
      <label>
        Learning note
        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <label className="checkbox-row">
        <input checked={revisit} type="checkbox" onChange={(event) => setRevisit(event.target.checked)} />
        Add to revisit queue
      </label>
      <button type="button" onClick={handleSave}>Save progress</button>
      {saved ? <p role="status">Progress saved</p> : null}
    </section>
  );
}
