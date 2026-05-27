import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { relativeTime } from "./relativeTime";
import type { LabRunArtifact } from "../../types";

interface RecentArtifactsPanelProps {
  artifacts: Array<LabRunArtifact & { createdAt?: string }>;
  now?: Date;
}

export function RecentArtifactsPanel({ artifacts, now }: RecentArtifactsPanelProps) {
  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <h2 className="text-[17px] leading-[24px] font-semibold">Recent artifacts</h2>
      </CardHeader>
      <CardContent>
        {artifacts.length === 0 ? (
          <p className="text-text-muted text-[14px] leading-[22px]">
            No lab artifacts yet. Run a lab and its output will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {artifacts.slice(0, 5).map((a) => (
              <li key={a.artifactPath} className="flex items-center justify-between gap-3">
                <span className="font-mono text-[14px] text-text-primary truncate">{a.labId}</span>
                <span className="font-mono text-[13px] text-text-muted shrink-0">
                  {a.createdAt ? relativeTime(a.createdAt, now) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link to="/artifacts" className="text-[13px] text-accent hover:text-accent-hover">
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
