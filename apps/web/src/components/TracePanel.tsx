import type { ChatTrace } from "../types";

interface TracePanelProps {
  trace: ChatTrace;
}

function asJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function TracePanel({ trace }: TracePanelProps) {
  return (
    <section className="trace-panel" aria-label="Chat trace">
      <h3>Trace</h3>
      <div>
        <h4>Prompt trace</h4>
        <pre>{trace.formattedPrompt}</pre>
      </div>
      <div>
        <h4>Token trace</h4>
        <pre>{asJson(trace.tokenTrace)}</pre>
      </div>
      <div>
        <h4>Context trace</h4>
        <pre>{asJson(trace.contextTrace)}</pre>
      </div>
      <div>
        <h4>Sampling trace</h4>
        <pre>{asJson(trace.samplingTrace)}</pre>
      </div>
      <div>
        <h4>Stream trace</h4>
        <p>{trace.streamChunks.join(" | ")}</p>
      </div>
      <div>
        <h4>Tool trace</h4>
        <pre>{asJson(trace.toolTrace ?? { mode: "none" })}</pre>
      </div>
      <div>
        <h4>Memory trace</h4>
        <pre>{asJson(trace.memoryTrace)}</pre>
      </div>
    </section>
  );
}
