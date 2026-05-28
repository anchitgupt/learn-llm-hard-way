import { SamplingPlot } from "@/viz";
import { TraceStep } from "./TraceStep";

interface SamplingEntry {
  step: number;
  token: string;
  probabilities: Record<string, number>;
  candidates: unknown;
}

interface SamplingStepProps {
  samplingTrace: SamplingEntry[];
}

function entriesToCandidates(probabilities: Record<string, number>): Array<{ token: string; probability: number }> {
  return Object.entries(probabilities).map(([token, probability]) => ({ token, probability }));
}

export function SamplingStep({ samplingTrace }: SamplingStepProps) {
  if (samplingTrace.length === 0) {
    return (
      <TraceStep number={6} total={8} name="Sampling" hint="Probabilities over candidate next tokens.">
        <p className="text-text-muted text-[13px]">No sampling steps recorded.</p>
      </TraceStep>
    );
  }

  return (
    <TraceStep
      number={6}
      total={8}
      name="Sampling"
      hint={
        samplingTrace.length > 1
          ? `${samplingTrace.length} sampling steps (scratch produces extras).`
          : "Probabilities over candidate next tokens."
      }
    >
      <div className="space-y-4">
        {samplingTrace.map((entry) => (
          <div key={entry.step} className="space-y-1">
            <p className="text-[12px] text-text-muted font-mono">
              step {entry.step} → selected: <span className="text-text-primary">{entry.token}</span>
            </p>
            <SamplingPlot
              candidates={entriesToCandidates(entry.probabilities)}
              selectedToken={entry.token}
              temperature={1.0}
            />
          </div>
        ))}
      </div>
    </TraceStep>
  );
}
