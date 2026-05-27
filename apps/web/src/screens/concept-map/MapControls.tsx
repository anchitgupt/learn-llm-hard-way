import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

const MINIMAP_STORAGE_KEY = "learn-llm.conceptmap.minimap";

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "missed",    label: "Missed" },
  { key: "completed", label: "Completed" },
  { key: "open",      label: "Open" }
] as const;

export function readMiniMapPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(MINIMAP_STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

interface MapControlsProps {
  onMiniMapChange?: (visible: boolean) => void;
}

export function MapControls({ onMiniMapChange }: MapControlsProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("filter") ?? "all";

  const [miniMap, setMiniMap] = useState<boolean>(() => readMiniMapPreference());
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    window.localStorage.setItem(MINIMAP_STORAGE_KEY, String(miniMap));
    onMiniMapChange?.(miniMap);
  }, [miniMap, onMiniMapChange]);

  function setFilter(next: string) {
    if (next === "all") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", next);
    }
    setSearchParams(searchParams, { replace: false });
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex gap-1" role="group" aria-label="Filter concepts">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            variant={active === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={cn(active === f.key && "ring-1 ring-accent")}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[13px] text-text-muted">
        <Switch
          checked={miniMap}
          onCheckedChange={(v: boolean) => setMiniMap(v)}
          aria-label="Mini-map"
        />
        Mini-map
      </label>
    </div>
  );
}
