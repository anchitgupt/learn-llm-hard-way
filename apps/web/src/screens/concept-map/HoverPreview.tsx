import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Concept, ProgressRecord, Track } from "../../types";
import type { ConceptStatus } from "./layout";

interface HoverPreviewProps {
  concept: Concept;
  track: Track;
  status: ConceptStatus;
  prereqIndex: Record<string, Concept | undefined>;
  progressByConcept: Record<string, ProgressRecord | undefined>;
}

function firstSentence(markdown: string): string {
  const lines = markdown.split("\n");
  let body = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    body = trimmed;
    break;
  }
  if (body.length <= 140) return body;
  const cut = body.lastIndexOf(" ", 140);
  return body.slice(0, cut > 0 ? cut : 140) + "…";
}

function statusBadgeVariant(status: ConceptStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "missed") return "destructive";
  if (status === "complete") return "default";
  if (status === "learning") return "secondary";
  return "outline";
}

export function HoverPreview({
  concept,
  track,
  status,
  prereqIndex,
  progressByConcept
}: HoverPreviewProps) {
  const summary = firstSentence(concept.lessonMarkdown ?? "");
  const prereqs = concept.prerequisites ?? [];

  return (
    <div className="w-[320px] rounded-md border border-border-subtle bg-bg-elevated p-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] leading-[22px] font-semibold text-text-primary truncate">
          {concept.title}
        </h3>
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </div>
      <p className="text-[12px] text-text-muted mt-1">Track: {track.title}</p>
      {summary ? (
        <p className="text-[13px] leading-[18px] text-text-primary mt-2">{summary}</p>
      ) : null}
      {prereqs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[12px] text-text-muted">
          <span>Prereqs:</span>
          {prereqs.map((id) => {
            const prereq = prereqIndex[id];
            const done = progressByConcept[id]?.status === "complete";
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-0.5">
                <span aria-hidden>{done ? "✓" : "○"}</span>
                <span>{prereq?.title ?? id}</span>
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="mt-3">
        <Link
          to={`/concepts/${concept.id}`}
          className="text-[13px] text-accent hover:text-accent-hover"
        >
          Open concept →
        </Link>
      </div>
    </div>
  );
}
