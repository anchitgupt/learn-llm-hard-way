import { TraceStep } from "./TraceStep";

interface ToolTrace {
  tool: string;
  expression: string;
  result: string;
  explanation: string;
}

interface ToolStepProps {
  toolTrace: ToolTrace;
}

export function ToolStep({ toolTrace }: ToolStepProps) {
  return (
    <TraceStep
      number={5}
      total={8}
      name="Tool verification"
      hint="A deterministic tool was called to ground the answer."
    >
      <div className="rounded-md bg-bg-inset border border-border-subtle p-3 space-y-2 font-mono text-[13px]">
        <p>
          <span className="text-text-muted">tool</span> ={" "}
          <span className="text-text-primary">{toolTrace.tool}</span>
        </p>
        <p>
          <span className="text-text-muted">expression</span> ={" "}
          <span className="text-text-primary">{toolTrace.expression}</span>
        </p>
        <p>
          <span className="text-text-muted">result</span> ={" "}
          <span className="text-text-primary">{toolTrace.result}</span>
        </p>
        <p className="text-text-muted">{toolTrace.explanation}</p>
      </div>
    </TraceStep>
  );
}
