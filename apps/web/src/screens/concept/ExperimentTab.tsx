import type { Concept } from "../../types";
import { resolveViz } from "./vizRegistry";
import { useExperimentData } from "./useExperimentData";

interface ExperimentTabProps {
  concept: Concept;
}

export function ExperimentTab({ concept }: ExperimentTabProps) {
  const entry = resolveViz(concept.visual);
  const props = useExperimentData(concept);

  if (!entry) {
    return (
      <p className="text-text-muted">
        No experiment for this concept yet. Run the lab to see its artifact, or open the chat playground.
      </p>
    );
  }
  const { Component, hint } = entry;
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-text-muted">{hint}</p>
      <Component {...props} />
    </div>
  );
}
