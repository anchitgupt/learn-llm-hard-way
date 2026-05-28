import type { ProgressRecord, Track } from "../../types";

export interface TrackStats {
  total: number;
  completed: number;
  percent: number;
  nextConceptId: string;
}

export function useTrackStats(track: Track, progress: ProgressRecord[]): TrackStats {
  const byConcept = new Map(progress.map((p) => [p.conceptId, p]));
  const total = track.concepts.length;
  const completed = track.concepts.filter((c) => byConcept.get(c.id)?.status === "complete").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const next = track.concepts.find((c) => byConcept.get(c.id)?.status !== "complete");
  const nextConceptId = (next ?? track.concepts[0])?.id ?? "";
  return { total, completed, percent, nextConceptId };
}
