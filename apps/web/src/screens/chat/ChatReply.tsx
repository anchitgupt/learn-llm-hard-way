import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatReplyProps {
  finalReply: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ChatReply({ finalReply, loading, error, onRetry }: ChatReplyProps) {
  if (error) {
    return (
      <Card className="bg-bg-surface border-danger/40">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-danger shrink-0" aria-hidden />
          <div role="alert" className="flex-1 text-[14px] text-text-primary">
            <span className="font-medium">Send failed.</span>{" "}
            <span className="text-text-muted">{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && !finalReply) {
    return (
      <Card className="bg-bg-surface">
        <CardContent className="p-4">
          <Skeleton data-skeleton className="h-16 w-full bg-bg-elevated" />
        </CardContent>
      </Card>
    );
  }

  if (!finalReply) {
    return (
      <Card className="bg-bg-surface">
        <CardContent className="p-6">
          <p className="text-text-muted text-[14px] leading-[22px]">
            Send a message to see how it flows through the model.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-bg-surface border-l-4 border-accent">
      <CardContent className="p-4">
        <p className="text-[12px] uppercase tracking-wide text-text-muted mb-2">Assistant reply</p>
        <p className="text-[15px] leading-[22px] text-text-primary whitespace-pre-wrap">{finalReply}</p>
      </CardContent>
    </Card>
  );
}
