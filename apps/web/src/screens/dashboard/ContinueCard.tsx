import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Concept, Track } from "../../types";

interface ContinueCardProps {
  concept: Concept | null;
  tracks: Track[];
}

/**
 * Show the next concept the learner should open.
 *
 * Body text is a raw slice of `lessonMarkdown` — it can cut mid-word and may
 * include markdown syntax. TODO: strip markdown + truncate at word boundary.
 */
export function ContinueCard({ concept, tracks }: ContinueCardProps) {
  if (!concept) {
    const first = tracks[0]?.concepts[0];
    return (
      <Card
        className="bg-bg-surface border-l-4 border-accent"
        style={{ boxShadow: "var(--glow-accent)" }}
      >
        <CardHeader>
          <h2 className="text-[24px] leading-[32px] font-semibold">Start the course</h2>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted mb-4">Begin with the smallest piece. Build up.</p>
          {first ? (
            <Button asChild>
              <Link to={`/concepts/${first.id}`}>
                Start with {first.title} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const track = tracks.find((t) => t.concepts.some((c) => c.id === concept.id));
  const positionIndex = track?.concepts.findIndex((c) => c.id === concept.id) ?? 0;
  const trackTotal = track?.concepts.length ?? 0;

  return (
    <Card
      className="bg-bg-surface border-l-4 border-accent"
      style={{ boxShadow: "var(--glow-accent)" }}
    >
      <CardHeader>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">
          Concept {positionIndex + 1} of {trackTotal} in {track?.title ?? ""}
        </p>
        <h2 className="text-[24px] leading-[32px] font-semibold">{concept.title}</h2>
      </CardHeader>
      <CardContent>
        <p className="text-text-muted mb-4">
          {concept.lessonMarkdown ? concept.lessonMarkdown.slice(0, 80) : ""}
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to={`/concepts/${concept.id}`}>
              Open concept <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
