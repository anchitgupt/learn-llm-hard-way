import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MissedTopic } from "../../types";

interface MissedTopicsPanelProps {
  missedTopics: MissedTopic[];
}

export function MissedTopicsPanel({ missedTopics }: MissedTopicsPanelProps) {
  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <h2 className="text-[17px] leading-[24px] font-semibold">Missed topics</h2>
      </CardHeader>
      <CardContent>
        {missedTopics.length === 0 ? (
          <p className="text-text-muted text-[14px] leading-[22px]">
            You haven&apos;t missed anything yet. Mistakes you mark go here so you can come back to them.
          </p>
        ) : (
          <ul className="space-y-2">
            {missedTopics.slice(0, 5).map((topic) => (
              <li key={`${topic.conceptId}-${topic.reason}`} className="flex items-center gap-3">
                <Badge variant="secondary">{topic.reason}</Badge>
                <Link
                  to={`/concepts/${topic.conceptId}`}
                  className="font-mono text-[14px] text-text-primary hover:text-accent"
                >
                  {topic.conceptId}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link to="/concepts?filter=missed" className="text-[13px] text-accent hover:text-accent-hover">
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
