import { useState } from "react";
import type { CheckpointAttempt } from "../types";

interface CheckpointPanelProps {
  question: string;
  onSubmit: (input: { submittedAnswer: string; confidence: number }) => Promise<CheckpointAttempt>;
}

export function CheckpointPanel({ question, onSubmit }: CheckpointPanelProps) {
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit() {
    const result = await onSubmit({ submittedAnswer, confidence });
    setFeedback(result.feedback);
  }

  return (
    <section className="checkpoint-panel">
      <h3>Checkpoint</h3>
      <p>{question}</p>
      <label>
        Checkpoint answer
        <textarea value={submittedAnswer} onChange={(event) => setSubmittedAnswer(event.target.value)} />
      </label>
      <label>
        Confidence
        <select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={handleSubmit}>Submit checkpoint</button>
      {feedback ? <p role="status">{feedback}</p> : null}
    </section>
  );
}
