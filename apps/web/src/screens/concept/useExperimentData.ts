import { useMemo } from "react";
import { useCourseData } from "@/shell/CourseDataProvider";
import { demoEmbeddings } from "@/viz/data/demoEmbeddings";
import type { AttentionMatrix, TokenItem } from "@/viz/data/types";
import type { Concept } from "../../types";
import { resolveViz } from "./vizRegistry";

interface SamplingCandidate {
  token: string;
  probability: number;
}

/**
 * Returns the props the chosen viz expects for this concept. Falls back
 * to a deterministic demo when no real artifact is available so the
 * tab is never empty.
 */
export function useExperimentData(concept: Concept): Record<string, unknown> {
  const { recentArtifacts } = useCourseData();
  const key = concept.visual ?? null;
  const entry = resolveViz(key);

  return useMemo(() => {
    if (!entry) return {};

    switch (key) {
      case "chat-playground":
        return {};

      case "token-flow":
      case "token-flow-svg": {
        const words = (concept.title ?? "tokens").split(/\s+/).filter(Boolean);
        const tokens: TokenItem[] = words.map((text, i) => ({
          id: 100 + i,
          text
        }));
        return { tokens };
      }

      case "attention-map": {
        const demo: AttentionMatrix = {
          tokens: ["the", "tiny", "model"],
          scores: [
            [1.0, -Infinity, -Infinity],
            [0.5, 0.5, -Infinity],
            [0.34, 0.33, 0.33]
          ]
        };
        return { data: demo };
      }

      case "loss-curve": {
        const series = [
          {
            label: "train",
            values: Array.from({ length: 60 }, (_, i) => 2.5 * Math.exp(-i / 18) + 0.4)
          }
        ];
        return { series, showRollingMean: true };
      }

      case "sampling-plot": {
        const candidates: SamplingCandidate[] = [
          { token: "the", probability: 0.51 },
          { token: "a",   probability: 0.30 },
          { token: "an",  probability: 0.19 }
        ];
        return { candidates, selectedToken: "the", temperature: 1.0 };
      }

      case "embedding-space":
        return { points: demoEmbeddings, selectedId: "cat" };

      default:
        return {};
    }
    // recentArtifacts intentionally referenced but not yet consumed;
    // future iteration derives real props per concept from artifacts.
    void recentArtifacts;
  }, [entry, key, concept.title, recentArtifacts]);
}
