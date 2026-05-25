import { TokenFlowSvg } from "./TokenFlowSvg";

interface VisualExperimentProps {
  visualId: string | null;
}

export function VisualExperiment({ visualId }: VisualExperimentProps) {
  if (visualId === "token-flow-svg") {
    return <TokenFlowSvg />;
  }
  if (visualId === "vector-similarity") {
    return <div className="visual-frame" role="img" aria-label="Vector similarity visual">vector dot product -&gt; score</div>;
  }
  if (visualId === "softmax-bars") {
    return <div className="visual-frame" role="img" aria-label="Softmax probabilities visual">logits -&gt; probabilities</div>;
  }
  if (visualId === "gradient-step" || visualId === "linear-loss-step") {
    return <div className="visual-frame" role="img" aria-label="Gradient step visual">loss goes down after update</div>;
  }
  return <p>No visual for this concept yet.</p>;
}
