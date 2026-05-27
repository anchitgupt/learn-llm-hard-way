import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseData } from "@/shell/CourseDataProvider";
import { touchConcept } from "../api";
import { ConceptHeader } from "./concept/ConceptHeader";
import { ExplanationTab } from "./concept/ExplanationTab";
import { LabTab } from "./concept/LabTab";
import { ExperimentTab } from "./concept/ExperimentTab";
import { CheckpointTab } from "./concept/CheckpointTab";
import { NotesTab } from "./concept/NotesTab";

const VALID_TABS = ["explanation", "lab", "experiment", "checkpoint", "notes"] as const;
type TabKey = (typeof VALID_TABS)[number];

function defaultTabFor(visual: string | null | undefined): TabKey {
  // Chat concepts default to Experiment so deep-links don't lose the chat product.
  return visual === "chat-playground" ? "experiment" : "explanation";
}

export function ConceptWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tracks, progressRecords, missedTopics, loading, refresh } = useCourseData();

  const { concept, track } = useMemo(() => {
    if (!id) return { concept: null, track: null };
    for (const t of tracks) {
      const c = t.concepts.find((concept) => concept.id === id);
      if (c) return { concept: c, track: t };
    }
    return { concept: null, track: null };
  }, [tracks, id]);

  useEffect(() => {
    if (!id) return;
    void touchConcept(id).catch(() => { /* best-effort */ });
  }, [id]);

  // Only show skeleton on the initial load when we have no tracks yet.
  // Subsequent refreshes (e.g. after checkpoint submit) use stale data so
  // tabs stay mounted and local feedback state is preserved.
  const hasData = tracks.length > 0;
  if (loading && !hasData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 bg-bg-surface" />
        <Skeleton className="h-10 w-96 bg-bg-surface" />
        <Skeleton className="h-8 w-full bg-bg-surface" />
      </div>
    );
  }

  if (!concept || !track) {
    return (
      <div className="space-y-4">
        <h1 className="text-[24px] leading-[32px] font-semibold">Concept not found</h1>
        <p className="text-text-muted">
          We couldn't find a concept with id <span className="font-mono">{id}</span>.
        </p>
      </div>
    );
  }

  const progressByConcept = Object.fromEntries(progressRecords.map((r) => [r.conceptId, r]));
  const missedConceptIds = new Set(missedTopics.map((m) => m.conceptId));
  const myProgress = progressByConcept[concept.id];

  const hasLab = concept.lab !== null && concept.lab !== undefined;
  const hasExperiment = concept.visual !== null && concept.visual !== undefined;

  const requestedTab = searchParams.get("tab");
  const fallback = defaultTabFor(concept.visual);
  let activeTab: TabKey = fallback;
  if (requestedTab && (VALID_TABS as readonly string[]).includes(requestedTab)) {
    const r = requestedTab as TabKey;
    if ((r === "lab" && !hasLab) || (r === "experiment" && !hasExperiment)) {
      // eslint-disable-next-line no-console
      console.warn(`Tab '${r}' not available for concept ${concept.id}; falling back to ${fallback}.`);
      activeTab = fallback;
    } else {
      activeTab = r;
    }
  }

  function setActiveTab(next: string) {
    if (next === fallback) {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", next);
    }
    setSearchParams(searchParams, { replace: false });
  }

  return (
    <div className="space-y-6">
      <ConceptHeader
        concept={concept}
        track={track}
        progressByConcept={progressByConcept}
        missedConceptIds={missedConceptIds}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
          {hasLab ? <TabsTrigger value="lab">Lab</TabsTrigger> : null}
          {hasExperiment ? <TabsTrigger value="experiment">Experiment</TabsTrigger> : null}
          <TabsTrigger value="checkpoint">Checkpoint</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="explanation" className="pt-6">
          <ExplanationTab concept={concept} />
        </TabsContent>

        {hasLab && concept.lab ? (
          <TabsContent value="lab" className="pt-6">
            <LabTab labId={concept.lab} conceptId={concept.id} onRunComplete={() => void refresh()} />
          </TabsContent>
        ) : null}

        {hasExperiment ? (
          <TabsContent value="experiment" className="pt-6">
            <ExperimentTab concept={concept} />
          </TabsContent>
        ) : null}

        <TabsContent value="checkpoint" className="pt-6">
          <CheckpointTab
            conceptId={concept.id}
            checkpoint={concept.checkpoint}
            onSubmitted={() => void refresh()}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
          <NotesTab
            conceptId={concept.id}
            existing={myProgress}
            onSaved={() => void refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
