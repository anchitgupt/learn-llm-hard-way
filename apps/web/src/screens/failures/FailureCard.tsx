import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FailureCase } from "../../types";

interface FailureCardProps {
  failure: FailureCase;
}

export function FailureCard({ failure }: FailureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = failure.modelOnlyOutput.length > 160
    ? failure.modelOnlyOutput.slice(0, 160) + "…"
    : failure.modelOnlyOutput;
  return (
    <Card onClick={() => setExpanded((v) => !v)} className="cursor-pointer transition hover:border-accent">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">{failure.category}</Badge>
        </div>
        <CardTitle className="text-[15px]">{failure.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-[13px]">
        <p className="text-text-muted">{expanded ? failure.modelOnlyOutput : preview}</p>
        {expanded ? (
          <>
            <Separator />
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-muted">Why it fails</p>
              <p>{failure.explanation}</p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-muted">Better strategy</p>
              <p>{failure.betterStrategy}</p>
            </div>
            {failure.relatedConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {failure.relatedConcepts.map((id) => (
                  <Link key={id} to={`/concepts/${id}`} onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline">{id}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
