import { useCallback, useEffect, useState } from "react";
import { deleteChatMemory, fetchChatMemory, saveChatMemory } from "../../api";
import type { ChatMemory } from "../../types";

export interface MemoryEditorState {
  memories: ChatMemory[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (content: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useMemoryEditor(open: boolean): MemoryEditorState {
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchChatMemory();
      setMemories(next);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const save = useCallback(
    async (content: string) => {
      setSaving(true);
      try {
        await saveChatMemory(content);
        await refresh();
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      const snapshot = memories;
      setMemories((prev) => prev.filter((m) => m.id !== id));
      try {
        await deleteChatMemory(id);
        setError(null);
      } catch {
        setMemories(snapshot);
        setError("Couldn't delete memory. Try again.");
      }
    },
    [memories]
  );

  return { memories, loading, saving, error, refresh, save, remove };
}
