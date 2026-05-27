import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { saveProgress } from "../../api";
import type { ProgressRecord } from "../../types";
import { useDebouncedCallback } from "./useDebouncedCallback";

interface NotesTabProps {
  conceptId: string;
  existing: ProgressRecord | undefined;
  onSaved: () => void;
}

export function NotesTab({ conceptId, existing, onSaved }: NotesTabProps) {
  const [note, setNote] = useState(existing?.note ?? "");
  const [confidence, setConfidence] = useState(existing?.confidence ?? 3);
  const [revisit, setRevisit] = useState(existing?.revisit ?? false);
  const [status, setStatus] = useState(existing?.status ?? "learning");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function persist(next: { note?: string; confidence?: number; revisit?: boolean; status?: string }) {
    const payload = {
      status: next.status ?? status,
      confidence: next.confidence ?? confidence,
      note: next.note ?? note,
      revisit: next.revisit ?? revisit
    };
    await saveProgress(conceptId, payload);
    setSavedAt(new Date());
    onSaved();
  }

  const { call: debouncedSave, flush } = useDebouncedCallback((value: string) => {
    void persist({ note: value });
  }, 400);

  // Flush pending debounced save on unmount.
  useEffect(() => flush, [flush]);

  return (
    <Card className="bg-bg-surface">
      <CardHeader>
        <CardTitle className="text-[17px] leading-[24px]">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            debouncedSave(e.target.value);
          }}
          rows={8}
          aria-label="Notes"
          className="w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary"
        />

        <div className="flex items-center gap-3">
          <label className="text-[13px] text-text-muted">Confidence</label>
          <input
            type="range"
            min={1}
            max={5}
            value={confidence}
            onChange={(e) => {
              const c = Number(e.target.value);
              setConfidence(c);
              void persist({ confidence: c });
            }}
            aria-label="Confidence"
          />
          <span className="font-mono text-[13px]">{confidence}/5</span>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            aria-label="Add to revisit queue"
            checked={revisit}
            onCheckedChange={(value: boolean) => {
              setRevisit(value);
              void persist({ revisit: value });
            }}
          />
          <span className="text-[13px] text-text-muted">Add to revisit queue</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStatus("complete");
              void persist({ status: "complete" });
            }}
          >
            Mark complete
          </Button>
          {savedAt ? (
            <span className="text-[12px] text-text-muted">Saved · {savedAt.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
