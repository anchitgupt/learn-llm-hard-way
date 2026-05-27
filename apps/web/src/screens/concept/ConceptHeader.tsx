import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Concept, ProgressRecord, Track } from "../../types";

interface ConceptHeaderProps {
  concept: Concept;
  track: Track;
  progressByConcept: Record<string, ProgressRecord | undefined>;
  missedConceptIds: Set<string>;
}

export function ConceptHeader({
  concept,
  track,
  progressByConcept,
  missedConceptIds
}: ConceptHeaderProps) {
  const positionIndex = track.concepts.findIndex((c) => c.id === concept.id);
  const total = track.concepts.length;
  const prev = positionIndex > 0 ? track.concepts[positionIndex - 1] : null;
  const next = positionIndex < total - 1 ? track.concepts[positionIndex + 1] : null;

  const myProgress = progressByConcept[concept.id];
  const isMissed = missedConceptIds.has(concept.id);

  const status = myProgress?.status ?? concept.status ?? "open";
  const confidence = myProgress?.confidence;

  const prereqs = concept.prerequisites ?? [];

  return (
    <header className="space-y-4 mb-6">
      {/* Breadcrumb */}
      <p className="text-[13px] text-text-muted">
        <Link to="/tracks" className="hover:text-text-primary">Tracks</Link>
        {" · "}
        <span>{track.title}</span>
        {" · "}
        <span>Concept {positionIndex + 1} of {total} in {track.title}</span>
      </p>

      {/* Title */}
      <h1 className="text-[28px] leading-[36px] font-semibold">{concept.title}</h1>

      {/* Status row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={status === "complete" ? "default" : "secondary"}>{status}</Badge>
        {typeof confidence === "number" ? (
          <Badge variant="outline">confidence {confidence}/5</Badge>
        ) : null}
        {isMissed ? <Badge variant="destructive">in missed queue</Badge> : null}
      </div>

      {/* Prerequisites */}
      {prereqs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
          <span>Prerequisites:</span>
          {prereqs.map((prereqId) => {
            const prereqConcept = track.concepts.find((c) => c.id === prereqId);
            const done = progressByConcept[prereqId]?.status === "complete";
            return (
              <Link
                key={prereqId}
                to={`/concepts/${prereqId}`}
                className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-0.5 hover:text-text-primary"
              >
                <span aria-hidden>{done ? "✓" : "○"}</span>
                <span>{prereqConcept?.title ?? prereqId}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Prev / Next */}
      <div className="flex gap-2">
        {prev ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/concepts/${prev.id}`} aria-label={`← Previous`}>
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden />
              <span aria-hidden>{prev.title}</span>
            </Link>
          </Button>
        ) : null}
        {next ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/concepts/${next.id}`}>
              {next.title} <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
