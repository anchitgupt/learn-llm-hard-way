import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LabRunArtifact } from "../../types";
import { AttentionThumb } from "./thumbs/AttentionThumb";
import { LossThumb } from "./thumbs/LossThumb";
import { GenerationThumb } from "./thumbs/GenerationThumb";
import { ComparisonThumb } from "./thumbs/ComparisonThumb";
import { FailureThumb } from "./thumbs/FailureThumb";

type R = Record<string, unknown>;
const isRecord = (v: unknown): v is R => typeof v === "object" && v !== null && !Array.isArray(v);

function pickThumb(artifact: unknown) {
  if (!isRecord(artifact)) return null;
  const attention = isRecord(artifact.attention) ? artifact.attention : null;
  if (attention && Array.isArray(attention.weights)) {
    return <AttentionThumb weights={attention.weights as number[][]} />;
  }
  const training = isRecord(artifact.training) ? artifact.training : null;
  if (training && Array.isArray(training.lossHistory)) {
    return <LossThumb history={training.lossHistory as number[]} />;
  }
  const generation = isRecord(artifact.generation) ? artifact.generation : null;
  if (generation && typeof generation.generatedText === "string") {
    return <GenerationThumb text={generation.generatedText} />;
  }
  const comparison = isRecord(artifact.comparison) ? artifact.comparison : null;
  if (comparison) {
    return (
      <ComparisonThumb
        base={typeof comparison.baseCompletion === "string" ? comparison.baseCompletion : undefined}
        assistant={typeof comparison.assistantFormatted === "string" ? comparison.assistantFormatted : undefined}
      />
    );
  }
  const failure = isRecord(artifact.failure) ? artifact.failure : null;
  if (failure) {
    return (
      <FailureThumb
        expectedFact={typeof failure.expectedFact === "string" ? failure.expectedFact : undefined}
        explanation={typeof failure.explanation === "string" ? failure.explanation : undefined}
      />
    );
  }
  return null;
}

interface ArtifactCardProps {
  artifact: LabRunArtifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const thumb = pickThumb(artifact.artifact);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <Link to={`/concepts/${artifact.conceptId}`} className="font-mono text-[12px] text-accent hover:underline">
          {artifact.conceptId}
        </Link>
        <Badge variant={artifact.status === "success" ? "secondary" : "destructive"}>
          {artifact.status}
        </Badge>
      </CardHeader>
      <CardContent>
        {thumb ?? <p className="text-[12px] text-text-muted">No preview available</p>}
      </CardContent>
    </Card>
  );
}
