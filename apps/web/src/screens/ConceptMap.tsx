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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useCourseData } from "@/shell/CourseDataProvider";
import { ConceptNode } from "./concept-map/ConceptNode";
import { MapControls, readMiniMapPreference } from "./concept-map/MapControls";
import { buildGraph, type ConceptNodeData, type ConceptStatus, type PlainEdge, type PlainNode } from "./concept-map/layout";

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

export function ConceptMap() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");

  const { tracks, progressRecords, missedTopics, loading } = useCourseData();
  const [showMiniMap, setShowMiniMap] = useState<boolean>(() => readMiniMapPreference());

  const progressByConcept = useMemo(
    () => Object.fromEntries(progressRecords.map((r) => [r.conceptId, r])),
    [progressRecords]
  );
  const missedConceptIds = useMemo(
    () => new Set(missedTopics.map((m) => m.conceptId)),
    [missedTopics]
  );

  const { nodes: allNodes, edges: allEdges } = useMemo(
    () => buildGraph(tracks, progressByConcept, missedConceptIds),
    [tracks, progressByConcept, missedConceptIds]
  );
  const { nodes, edges } = useMemo(
    () => filteredGraph(allNodes, allEdges, filter),
    [allNodes, allEdges, filter]
  );

  const rfNodes: RFConceptNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data
  }));
  const rfEdges: RFEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <MapControls onMiniMapChange={setShowMiniMap} />
      {renderCanvas()}

      {/* HoverPreview is built and tested but on-graph wiring deferred; the
          hidden HoverCard reference below keeps the import exercised so future
          wiring doesn't need a fresh import. */}
      <span hidden>
        <HoverCard>
          <HoverCardTrigger />
          <HoverCardContent />
        </HoverCard>
      </span>
    </div>
  );
}
