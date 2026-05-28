import type { PlainEdge } from "./layout";

export interface Neighbourhood {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/**
 * Returns the set of nodes and edges that should be highlighted when
 * `hoveredNodeId` is hovered. The hovered node is always included.
 * Any edge with `hoveredNodeId` as either source or target is included,
 * along with the node on the other end.
 */
export function neighbourhood(hoveredNodeId: string, edges: PlainEdge[]): Neighbourhood {
  const nodeIds = new Set<string>([hoveredNodeId]);
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (edge.source === hoveredNodeId) {
      edgeIds.add(edge.id);
      nodeIds.add(edge.target);
    } else if (edge.target === hoveredNodeId) {
      edgeIds.add(edge.id);
      nodeIds.add(edge.source);
    }
  }
  return { nodeIds, edgeIds };
}
