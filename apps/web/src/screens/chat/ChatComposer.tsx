import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ChatDemoInput } from "../../types";

interface ChatComposerProps {
  message: string;
  mode: ChatDemoInput["mode"];
  answerStyle: ChatDemoInput["answerStyle"];
  toolMode: ChatDemoInput["toolMode"];
  memoryMode: ChatDemoInput["memoryMode"];
  loading: boolean;
  onMessageChange: (value: string) => void;
  onModeChange: (value: ChatDemoInput["mode"]) => void;
  onAnswerStyleChange: (value: ChatDemoInput["answerStyle"]) => void;
  onToolModeChange: (value: ChatDemoInput["toolMode"]) => void;
  onMemoryModeChange: (value: ChatDemoInput["memoryMode"]) => void;
  onSend: () => void;
}

interface SegmentedGroupProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<T>;
  onChange: (next: T) => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: SegmentedGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex gap-1" role="group" aria-label={label}>
        {options.map((opt) => (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={value === opt ? "default" : "outline"}
            onClick={() => onChange(opt)}
            className={cn(value === opt && "ring-1 ring-accent")}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}

const MODE_OPTIONS = ["assistant", "base"] as const;
const STYLE_OPTIONS = ["short", "scratch"] as const;
const TOOL_OPTIONS = ["none", "verified"] as const;
const MEMORY_OPTIONS = ["context", "saved"] as const;

export function ChatComposer({
  message, mode, answerStyle, toolMode, memoryMode, loading,
  onMessageChange, onModeChange, onAnswerStyleChange, onToolModeChange, onMemoryModeChange,
  onSend
}: ChatComposerProps) {
  return (
    <Card className="bg-bg-surface">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Segmented label="Mode"         value={mode}        options={MODE_OPTIONS}   onChange={onModeChange} />
          <Segmented label="Answer style" value={answerStyle} options={STYLE_OPTIONS}  onChange={onAnswerStyleChange} />
          <Segmented label="Tool mode"    value={toolMode}    options={TOOL_OPTIONS}   onChange={onToolModeChange} />
          <Segmented label="Memory"       value={memoryMode}  options={MEMORY_OPTIONS} onChange={onMemoryModeChange} />
        </div>

        <label className="block">
          <span className="text-[12px] uppercase tracking-wide text-text-muted">Message</span>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={4}
            aria-label="Message"
            className="mt-1 w-full rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary font-mono"
          />
        </label>

        <div className="flex justify-end">
          <Button type="button" onClick={onSend} disabled={loading}>
            <Play className="h-4 w-4 mr-1" />
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
