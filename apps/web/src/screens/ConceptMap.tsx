import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseData } from "@/shell/CourseDataProvider";
import { ConceptNode } from "./concept-map/ConceptNode";
import { MapControls, readMiniMapPreference } from "./concept-map/MapControls";
import { buildGraph, type ConceptNodeData, type ConceptStatus, type PlainEdge, type PlainNode } from "./concept-map/layout";
import { ConceptHoverContext } from "./concept-map/HoverContext";
import { neighbourhood } from "./concept-map/highlight";

type RFConceptNode = RFNode<ConceptNodeData>;

const FILTERS = new Set(["missed", "completed", "open"]);

function filteredGraph(
  nodes: PlainNode[],
  edges: PlainEdge[],
  filter: string | null
): { nodes: PlainNode[]; edges: PlainEdge[] } {
  if (!filter || !FILTERS.has(filter)) {
    return { nodes, edges };
  }

  const keepStatus = (s: ConceptStatus) => {
    if (filter === "missed") return s === "missed";
    if (filter === "completed") return s === "complete";
    if (filter === "open") return s === "open" || s === "learning";
    return true;
  };

  const keptNodes = nodes.filter((n) => keepStatus(n.data.status));
  const keptIds = new Set(keptNodes.map((n) => n.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));
  return { nodes: keptNodes, edges: keptEdges };
}

const nodeTypes = { concept: ConceptNode };
const HIGHLIGHT_EDGE_STYLE = { stroke: "var(--accent)", strokeWidth: 2 } as const;
const DIMMED_EDGE_STYLE = { opacity: 0.18 } as const;

export function ConceptMap() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");

  const { tracks, progressRecords, missedTopics, loading } = useCourseData();
  const [showMiniMap, setShowMiniMap] = useState<boolean>(() => readMiniMapPreference());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const progressByConcept = useMemo(
    () => Object.fromEntries(progressRecords.map((r) => [r.conceptId, r])),
    [progressRecords]
  );
  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((m) => m.conceptId)),
    [missedTopics]
  );
  const prereqIndex = useMemo(() => {
    const out: Record<string, ReturnType<typeof Object>> = {};
    for (const track of tracks) {
      for (const concept of track.concepts) {
        out[concept.id] = concept;
      }
    }
    return out as Record<string, import("../types").Concept | undefined>;
  }, [tracks]);

  const { nodes: allNodes, edges: allEdges } = useMemo(
    () => buildGraph(tracks, progressByConcept, missedConceptIds),
    [tracks, progressByConcept, missedConceptIds]
  );
  const { nodes, edges } = useMemo(
    () => filteredGraph(allNodes, allEdges, filter),
    [allNodes, allEdges, filter]
  );

  const highlight = useMemo(
    () => (hoveredNodeId ? neighbourhood(hoveredNodeId, edges) : null),
    [hoveredNodeId, edges]
  );

  const rfNodes: RFConceptNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: highlight
      ? {
          ...n.data,
          dim: !highlight.nodeIds.has(n.id),
          hovered: n.id === hoveredNodeId
        }
      : n.data
  }));
  const rfEdges: RFEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    style: highlight
      ? highlight.edgeIds.has(e.id)
        ? HIGHLIGHT_EDGE_STYLE
        : DIMMED_EDGE_STYLE
      : undefined
  }));

  function renderCanvas() {
    if (loading && tracks.length === 0) {
      return (
        <div className="space-y-4 flex-1">
          <Skeleton className="h-[60vh] w-full bg-bg-surface" />
        </div>
      );
    }
    if (tracks.length === 0) {
      return <p className="flex-1 text-text-muted">No concepts yet.</p>;
    }
    if (nodes.length === 0) {
      return (
        <p className="flex-1 flex items-center justify-center text-text-muted">
          No concepts match this filter.
        </p>
      );
    }
    return (
      <div className="flex-1 relative rounded-md border border-border-subtle overflow-hidden">
        <ConceptHoverContext.Provider value={{ prereqIndex, progressByConcept }}>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag
            zoomOnScroll
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            edgesFocusable={false}
            onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} color="var(--border-subtle)" />
            {showMiniMap ? (
              <MiniMap
                pannable
                zoomable
                nodeColor={(node) => {
                  const data = node.data as ConceptNodeData | undefined;
                  switch (data?.status) {
                    case "complete": return "var(--success)";
                    case "missed":   return "var(--danger)";
                    case "learning": return "var(--accent)";
                    default:         return "var(--text-faint)";
                  }
                }}
              />
            ) : null}
            <Controls position="bottom-right" showInteractive={false} />
          </ReactFlow>
        </ConceptHoverContext.Provider>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <MapControls onMiniMapChange={setShowMiniMap} />
      {renderCanvas()}
    </div>
  );
}
