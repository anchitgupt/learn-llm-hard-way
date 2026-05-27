import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProgressRecord, Track } from "../../types";

interface TrackProgressGridProps {
  tracks: Track[];
  progressRecords: ProgressRecord[];
}

function completedCountFor(track: Track, records: ProgressRecord[]): number {
  const completeSet = new Set(records.filter((r) => r.status === "complete").map((r) => r.conceptId));
  return track.concepts.filter((c) => completeSet.has(c.id)).length;
}

export function TrackProgressGrid({ tracks, progressRecords }: TrackProgressGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {tracks.map((track) => {
        const completed = completedCountFor(track, progressRecords);
        const total = track.concepts.length;
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
        return (
          <Card key={track.id} className="bg-bg-surface">
            <CardHeader>
              <CardTitle className="text-[15px] leading-[22px]">{track.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={pct} className="mb-2" />
              <p className="font-mono text-[13px] text-text-muted">{completed} / {total}</p>
              <Link to="/tracks" className="text-[13px] text-accent hover:text-accent-hover">
                Open {track.title} →
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
