import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runLab } from "../../api";

interface LabTabProps {
  labId: string;
  conceptId: string;
  onRunComplete: () => void;
}

export function LabTab({ labId, conceptId, onRunComplete }: LabTabProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      await runLab(labId);
      onRunComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lab failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[15px] leading-[22px] font-mono">{labId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-text-muted text-[14px]">
          Runs the lab on a small deterministic input and writes the artifact to
          {" "}<span className="font-mono">artifacts/labs/</span>.
        </p>
        <div>
          <Button type="button" onClick={handleRun} disabled={running}>
            <Play className="h-4 w-4 mr-1" />
            {running ? "Running…" : "Run lab"}
          </Button>
        </div>
        {error ? (
          <div role="alert" className="flex items-start gap-3 p-3 border border-danger/40 rounded-md bg-bg-elevated">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-danger shrink-0" />
            <div className="flex-1 text-[13px] text-text-primary">
              <span className="font-medium">Lab run failed.</span>{" "}
              <span className="text-text-muted">{error}</span>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleRun}>
              Try again
            </Button>
          </div>
        ) : null}
        <p className="text-[12px] text-text-muted">
          See the latest output in <Link to="/artifacts" className="text-accent hover:text-accent-hover">Artifacts</Link>.
        </p>
        <span className="hidden" data-concept={conceptId} />
      </CardContent>
    </Card>
  );
}
