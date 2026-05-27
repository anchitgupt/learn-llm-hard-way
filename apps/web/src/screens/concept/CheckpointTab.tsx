import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchCheckpointAttempts, submitCheckpoint } from "../../api";
import type { Checkpoint, CheckpointAttempt } from "../../types";

interface CheckpointTabProps {
  conceptId: string;
  checkpoint: Checkpoint;
  onSubmitted: () => void;
}

export function CheckpointTab({ conceptId, checkpoint, onSubmitted }: CheckpointTabProps) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CheckpointAttempt[]>([]);

  useEffect(() => {
    setFeedback(null);
    setAnswer("");
    fetchCheckpointAttempts(conceptId).then(setAttempts).catch(() => setAttempts([]));
  }, [conceptId]);

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitCheckpoint(conceptId, { submittedAnswer: answer, confidence });
      setFeedback(result.feedback);
      setAttempts((prev) => [result, ...prev]);
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-[17px] leading-[24px]">Checkpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-primary">{checkpoint.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary font-mono"
            aria-label="Your answer"
          />
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-text-muted">Confidence</label>
            <input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              aria-label="Confidence"
            />
            <span className="font-mono text-[13px]">{confidence}/5</span>
          </div>
          <div>
            <Button type="button" onClick={handleSubmit} disabled={submitting || !answer.trim()}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
          {feedback ? (
            <p role="status" className="text-[14px] text-text-primary p-3 rounded-md bg-bg-elevated border border-border-subtle">
              {feedback}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {attempts.length > 0 ? (
        <Card className="bg-bg-surface">
          <CardHeader>
            <CardTitle className="text-[15px] leading-[22px]">Attempt history</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <ul className="space-y-2">
                {attempts.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px]">
                    <Badge variant={a.correct ? "default" : "destructive"}>
                      {a.correct ? "passed" : "failed"}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-mono text-text-primary">{a.submittedAnswer}</div>
                      <div className="text-text-muted">confidence {a.confidence}/5</div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
