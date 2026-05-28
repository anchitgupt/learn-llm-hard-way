import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Checkpoint } from "../../../types";

interface CheckpointRailProps {
  checkpoint: Checkpoint;
}

/**
 * A "read for the answer" preview of the upcoming checkpoint question.
 * Renders the question only — never the answer. Anchors to the Checkpoint
 * tab via the workspace's URL-synced ?tab=checkpoint param.
 */
export function CheckpointRail({ checkpoint }: CheckpointRailProps) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("tab", "checkpoint");
  const checkpointHref = `${location.pathname}?${params.toString()}`;

  return (
    <aside className="sticky top-6">
      <Card>
        <CardHeader>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">Up next</p>
          <CardTitle className="text-[14px]">Checkpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[13px] leading-[20px]">"{checkpoint.question}"</p>
          <Link to={checkpointHref}>
            <Button size="sm" variant="outline">Answer it →</Button>
          </Link>
        </CardContent>
      </Card>
    </aside>
  );
}
