interface ArtifactPreviewProps {
  artifact: unknown;
}

type ArtifactRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ArtifactRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function matrixText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  return value
    .map((row) => (Array.isArray(row) ? row.map(formatValue).join("  ") : formatValue(row)))
    .join("\n");
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  if (!isRecord(artifact)) return null;

  const attention = isRecord(artifact.attention) ? artifact.attention : null;
  const training = isRecord(artifact.training) ? artifact.training : null;
  const generation = isRecord(artifact.generation) ? artifact.generation : null;
  const comparison = isRecord(artifact.comparison) ? artifact.comparison : null;
  const failure = isRecord(artifact.failure) ? artifact.failure : null;
  const weights = attention ? matrixText(attention.weights) : null;
  const lossHistory = Array.isArray(training?.lossHistory)
    ? training.lossHistory.map(formatValue).join(" -> ")
    : null;

  return (
    <section className="artifact-preview" aria-label="Artifact preview">
      <h4>Artifact preview</h4>
      {weights ? (
        <div>
          <h5>Attention weights</h5>
          <pre>{weights}</pre>
        </div>
      ) : null}
      {lossHistory ? (
        <div>
          <h5>Loss history</h5>
          <p>{lossHistory}</p>
        </div>
      ) : null}
      {typeof generation?.generatedText === "string" ? (
        <div>
          <h5>Generated text</h5>
          <p>{generation.generatedText}</p>
        </div>
      ) : null}
      {comparison ? (
        <div>
          <h5>Base vs assistant</h5>
          {typeof comparison.baseCompletion === "string" ? <p>{comparison.baseCompletion}</p> : null}
          {typeof comparison.assistantFormatted === "string" ? <p>{comparison.assistantFormatted}</p> : null}
        </div>
      ) : null}
      {failure ? (
        <div>
          <h5>Factuality failure</h5>
          {typeof failure.expectedFact === "string" ? <p>{failure.expectedFact}</p> : null}
          {typeof failure.explanation === "string" ? <p>{failure.explanation}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
