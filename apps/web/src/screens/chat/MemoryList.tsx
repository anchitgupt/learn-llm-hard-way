import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMemory } from "../../types";

interface MemoryListProps {
  memories: ChatMemory[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export function MemoryList({ memories, loading, onDelete }: MemoryListProps) {
  if (loading && memories.length === 0) {
    return <p className="text-text-muted text-[14px]">Loading memories…</p>;
  }
  if (memories.length === 0) {
    return <p className="text-text-muted text-[14px]">No memories saved yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {memories.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-3 rounded-md border border-border-subtle bg-bg-inset p-2"
        >
          <div className="space-y-1">
            <p className="font-mono text-[13px] break-words">{m.content}</p>
            <p className="text-[11px] text-text-muted">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`delete memory ${m.id}`}
            onClick={() => onDelete(m.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
