import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MemoryAddFormProps {
  saving: boolean;
  onSave: (content: string) => Promise<void>;
}

export function MemoryAddForm({ saving, onSave }: MemoryAddFormProps) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!trimmed) return;
        await onSave(trimmed);
        setValue("");
      }}
    >
      <label htmlFor="memory-new" className="text-[12px] uppercase tracking-wide text-text-muted">
        New memory
      </label>
      <textarea
        id="memory-new"
        aria-label="new memory"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={saving}
        rows={3}
        className="w-full rounded-md border border-border-subtle bg-bg-inset p-2 text-[14px] font-mono"
        placeholder="Tell the assistant something to remember…"
      />
      <Button type="submit" disabled={saving || !trimmed} size="sm">
        Save
      </Button>
    </form>
  );
}
