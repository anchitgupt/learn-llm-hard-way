import type { Concept, ProgressRecord, Track } from "../../types";

export type ConceptStatus = "complete" | "missed" | "learning" | "open";

/**
 * Node data attached to each concept's React Flow node. The
 * `Record<string, unknown>` intersection satisfies React Flow v12's
 * `Node<T extends Record<string, unknown>>` generic constraint without
 * polluting consumers' property access.
 */
export type ConceptNodeData = {
  concept: Concept;
  track: Track;
  status: ConceptStatus;
  /** Set during edge highlighting when another node is hovered. */
  dim?: boolean;
  /** Set during edge highlighting on the actively hovered node. */
  hovered?: boolean;
} & Record<string, unknown>;

export interface PlainNode {
  id: string;
  position: { x: number; y: number };
  data: ConceptNodeData;
  type: "concept";
}

export interface PlainEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
}

export const COLUMN_WIDTH = 260;
export const ROW_HEIGHT = 110;
export const COLUMN_X_OFFSET = 40;
export const ROW_Y_OFFSET = 40;

export function statusFor(
  conceptId: string,
  progressByConcept: Record<string, ProgressRecord | undefined>,
  missedConceptIds: Set<string>
): ConceptStatus {
  if (missedConceptIds.has(conceptId)) return "missed";
  const record = progressByConcept[conceptId];
  if (record?.status === "complete") return "complete";
  if (record?.status === "learning") return "learning";
  return "open";
}

export function buildGraph(
  tracks: Track[],
  progressByConcept: Record<string, ProgressRecord | undefined>,
  missedConceptIds: Set<string>
): { nodes: PlainNode[]; edges: PlainEdge[] } {
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  const nodes: PlainNode[] = [];
  for (let i = 0; i < sortedTracks.length; i++) {
    const track = sortedTracks[i];
    const sortedConcepts = [...track.concepts].sort((a, b) => a.order - b.order);
    for (let j = 0; j < sortedConcepts.length; j++) {
      const concept = sortedConcepts[j];
      nodes.push({
        id: concept.id,
        position: {
          x: COLUMN_X_OFFSET + i * COLUMN_WIDTH,
          y: ROW_Y_OFFSET + j * ROW_HEIGHT
        },
        data: {
          concept,
          track,
          status: statusFor(concept.id, progressByConcept, missedConceptIds)
        },
        type: "concept"
      });
    }
  }

  const edges: PlainEdge[] = [];
  for (const track of sortedTracks) {
    for (const concept of track.concepts) {
      for (const prereqId of concept.prerequisites ?? []) {
        edges.push({
          id: `${prereqId}->${concept.id}`,
          source: prereqId,
          target: concept.id,
          type: "smoothstep"
        });
      }
    }
  }

  return { nodes, edges };
}
