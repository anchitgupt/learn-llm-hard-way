import { createContext, useContext } from "react";
import type { Concept, ProgressRecord } from "../../types";

export interface ConceptHoverContextValue {
  prereqIndex: Record<string, Concept | undefined>;
  progressByConcept: Record<string, ProgressRecord | undefined>;
}

export const ConceptHoverContext = createContext<ConceptHoverContextValue | null>(null);

export function useConceptHoverContext(): ConceptHoverContextValue | null {
  return useContext(ConceptHoverContext);
}
