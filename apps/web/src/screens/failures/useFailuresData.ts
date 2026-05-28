import { useCallback, useEffect, useState } from "react";
import { fetchChatFailures, fetchChatPreference } from "../../api";
import type { FailureCase, PreferenceSimulation } from "../../types";

export interface FailuresData {
  failures: FailureCase[];
  preference: PreferenceSimulation | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFailuresData(): FailuresData {
  const [failures, setFailures] = useState<FailureCase[]>([]);
  const [preference, setPreference] = useState<PreferenceSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([fetchChatFailures(), fetchChatPreference()]);
      setFailures(f);
      setPreference(p);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { failures, preference, loading, error, refresh };
}
