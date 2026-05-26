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
  if (visualId === "attention-weights") {
    return <div className="visual-frame" role="img" aria-label="Attention weights visual">query x key -&gt; weights -&gt; value mix</div>;
  }
  if (visualId === "causal-mask") {
    return <div className="visual-frame" role="img" aria-label="Causal mask visual">past tokens visible, future tokens blocked</div>;
  }
  if (visualId === "position-vectors") {
    return <div className="visual-frame" role="img" aria-label="Position vectors visual">token vector + position vector</div>;
  }
  if (visualId === "transformer-block-flow") {
    return <div className="visual-frame" role="img" aria-label="Transformer block visual">attention -&gt; feed-forward -&gt; updated token vectors</div>;
  }
  if (visualId === "packed-examples" || visualId === "loss-curve" || visualId === "sampling-trace") {
    return <div className="visual-frame" role="img" aria-label="Mini LLM training visual">context window -&gt; next token -&gt; loss -&gt; sample</div>;
  }
  if (visualId === "format-comparison" || visualId === "failure-case") {
    return <div className="visual-frame" role="img" aria-label="Model behavior comparison visual">plausible continuation is not verified truth</div>;
  }
  return <p>No visual for this concept yet.</p>;
}
