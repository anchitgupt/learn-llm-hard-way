import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GlossaryEntry } from "../../types";

interface TermCardProps {
  entry: GlossaryEntry;
}

export function TermCard({ entry }: TermCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      onClick={() => setExpanded((v) => !v)}
      className="cursor-pointer transition hover:border-accent"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-[16px] font-semibold">{entry.term}</CardTitle>
        {entry.relatedConcepts.length > 0 ? (
          <Badge variant="secondary">{entry.relatedConcepts.length} related</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[14px]">{entry.shortDefinition}</p>
        {expanded ? (
          <>
            <Separator />
            <p className="text-[13px] text-text-muted">{entry.explanation}</p>
            {entry.relatedConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {entry.relatedConcepts.map((id) => (
                  <Link
                    key={id}
                    to={`/concepts/${id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
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
