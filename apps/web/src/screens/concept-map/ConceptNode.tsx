import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { ConceptNodeData, ConceptStatus } from "./layout";

interface ConceptNodeProps {
  data: ConceptNodeData;
  selected: boolean;
}

function statusDotColor(status: ConceptStatus): string {
  switch (status) {
    case "complete":  return "var(--success)";
    case "missed":    return "var(--danger)";
    case "learning":  return "var(--accent)";
    case "open":
    default:          return "var(--text-faint)";
  }
}

function statusBadgeVariant(status: ConceptStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "missed") return "destructive";
  if (status === "complete") return "default";
  if (status === "learning") return "secondary";
  return "outline";
}

export function ConceptNode({ data, selected }: ConceptNodeProps) {
  const navigate = useNavigate();
  const { concept, track, status } = data;
  const missed = status === "missed";

  return (
    <button
      type="button"
      data-status={status}
      data-missed={missed || undefined}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/concepts/${concept.id}`);
      }}
      aria-label={`${concept.title} — ${track.title} — ${status}`}
      className={cn(
        "w-[220px] h-[80px] rounded-md text-left px-3 py-2",
        "bg-bg-surface border border-border-subtle",
        "hover:border-accent transition-[border-color] duration-base ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected && "ring-2 ring-accent",
        missed && "border-dashed border-danger"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ background: statusDotColor(status) }}
        />
        <span className="font-medium text-[14px] leading-[20px] truncate text-text-primary">
          {concept.title}
        </span>
      </div>
      <div className="text-[12px] leading-[16px] text-text-muted mt-1 truncate">
        {track.title}
      </div>
      <div className="flex justify-end mt-1">
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </div>
    </button>
  );
}
