import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchGlossary,
  fetchMissedTopics,
  fetchProgress,
  fetchRecentArtifacts,
  fetchTracks
} from "../api";
import type {
  Concept,
  GlossaryEntry,
  LabRunArtifact,
  MissedTopic,
  ProgressRecord,
  Track
} from "../types";

interface CourseData {
  tracks: Track[];
  glossaryEntries: GlossaryEntry[];
  missedTopics: MissedTopic[];
  recentArtifacts: LabRunArtifact[];
  progressRecords: ProgressRecord[];
  totals: { conceptCount: number; completedConceptCount: number };
  continueConcept: Concept | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CourseDataContext = createContext<CourseData | null>(null);

export function CourseDataProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [missedTopics, setMissedTopics] = useState<MissedTopic[]>([]);
  const [recentArtifacts, setRecentArtifacts] = useState<LabRunArtifact[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, g, m, a, p] = await Promise.all([
        fetchTracks(),
        fetchGlossary(),
        fetchMissedTopics(),
        fetchRecentArtifacts(),
        fetchProgress()
      ]);
      setTracks(t);
      setGlossaryEntries(g);
      setMissedTopics(m);
      setRecentArtifacts(a);
      setProgressRecords(p);
      setError(null);
    } catch (unknownError: unknown) {
      setError(unknownError instanceof Error ? unknownError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const conceptIndex = useMemo(() => {
    const map = new Map<string, Concept>();
    for (const track of tracks) {
      for (const concept of track.concepts) {
        map.set(concept.id, concept);
      }
    }
    return map;
  }, [tracks]);

  const totals = useMemo(() => {
    const conceptCount = conceptIndex.size;
    const completedConceptCount = progressRecords.filter((r) => r.status === "complete").length;
    return { conceptCount, completedConceptCount };
  }, [conceptIndex, progressRecords]);

  const continueConcept = useMemo<Concept | null>(() => {
    for (const missed of missedTopics) {
      const concept = conceptIndex.get(missed.conceptId);
      if (concept) return concept;
    }
    const sortedByOpened = [...progressRecords]
      .filter((r) => r.lastOpenedAt)
      .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""));
    for (const record of sortedByOpened) {
      const concept = conceptIndex.get(record.conceptId);
      if (concept) return concept;
    }
    return tracks[0]?.concepts[0] ?? null;
  }, [missedTopics, progressRecords, tracks, conceptIndex]);

  const value: CourseData = {
    tracks, glossaryEntries, missedTopics, recentArtifacts, progressRecords,
    totals, continueConcept, error, loading, refresh
  };

  return <CourseDataContext.Provider value={value}>{children}</CourseDataContext.Provider>;
}

export function useCourseData(): CourseData {
  const value = useContext(CourseDataContext);
  if (!value) {
    throw new Error("useCourseData must be used inside <CourseDataProvider>");
  }
  return value;
}

/**
 * Soft variant: returns null when used outside a `<CourseDataProvider>`
 * instead of throwing. Use for components that may render standalone in
 * tests or that want to degrade gracefully when no data is available.
 */
export function useOptionalCourseData(): CourseData | null {
  return useContext(CourseDataContext);
}
