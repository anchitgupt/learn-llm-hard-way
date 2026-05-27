import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface MigrationBannerProps {
  scheduledIn: number;
  note?: string;
}

export function MigrationBanner({ scheduledIn, note }: MigrationBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 px-4 py-3 mb-6",
        "border border-border-subtle rounded-md bg-bg-elevated",
        "text-text-muted text-[13px] leading-[18px]"
      )}
    >
      <Info aria-hidden className="h-4 w-4 mt-0.5 text-accent shrink-0" />
      <div>
        <span className="text-text-primary font-medium">
          Migration in progress.
        </span>{" "}
        This screen will be polished in sub-project {scheduledIn} of the UI overhaul.
        {note ? <> {note}</> : null}
      </div>
    </div>
  );
}
