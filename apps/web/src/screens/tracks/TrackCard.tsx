import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProgressRecord, Track } from "../../types";
import { TrackProgress } from "./TrackProgress";
import { useTrackStats } from "./useTrackStats";

interface TrackCardProps {
  track: Track;
  progress: ProgressRecord[];
}

const STATUS_PRECEDENCE: Record<string, number> = {
  missed: 3, complete: 2, learning: 1, open: 0
};

function dotStatus(conceptId: string, progress: ProgressRecord[]): string {
  const record = progress.find((p) => p.conceptId === conceptId);
  if (!record) return "open";
  return record.status in STATUS_PRECEDENCE ? record.status : "open";
}

export function TrackCard({ track, progress }: TrackCardProps) {
  const stats = useTrackStats(track, progress);
  return (
    <Card>
      <CardHeader className="space-y-1">
        <p className="text-[12px] uppercase tracking-wide text-text-muted font-mono">
          {String(track.order).padStart(2, "0")}
        </p>
        <CardTitle>{track.title}</CardTitle>
        <p className="text-[13px] text-text-muted">{track.summary}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <TrackProgress completed={stats.completed} total={stats.total} percent={stats.percent} />
        <ul className="space-y-1">
          {track.concepts.map((c) => {
            const status = dotStatus(c.id, progress);
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 font-mono text-[13px]">
                <span className="flex items-center gap-2">
                  <span
                    data-testid="status-dot"
                    data-status={status}
                    className="size-2 rounded-full bg-accent"
                  />
                  <span>{c.order}. {c.title}</span>
                </span>
                <Link to={`/concepts/${c.id}`} className="text-accent hover:underline">Open →</Link>
              </li>
            );
          })}
        </ul>
        <Link to={`/concepts/${stats.nextConceptId}`}>
          <Button size="sm">Start track →</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
