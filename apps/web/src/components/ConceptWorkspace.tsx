import type { Concept } from "../types";
import { ProgressPanel } from "./ProgressPanel";
import { TokenFlowSvg } from "./TokenFlowSvg";

interface ConceptWorkspaceProps {
  concept: Concept;
}

export function ConceptWorkspace({ concept }: ConceptWorkspaceProps) {
  return (
    <main className="workspace">
      <section className="lesson">
        <p className="eyebrow">Concept Workspace</p>
        <h2>{concept.title}</h2>
        <article>{concept.lessonMarkdown}</article>
      </section>
      <section className="visual-panel">
        <h3>Visual</h3>
        {concept.visual === "token-flow-svg" ? <TokenFlowSvg /> : <p>No visual for this concept yet.</p>}
      </section>
      <section className="checkpoint">
        <h3>Checkpoint</h3>
        <p>{concept.checkpoint.question}</p>
      </section>
      <ProgressPanel conceptId={concept.id} />
    </main>
  );
}
