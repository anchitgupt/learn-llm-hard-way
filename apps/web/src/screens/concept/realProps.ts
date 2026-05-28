import type { AttentionMatrix, TokenItem } from "@/viz/data/types";
import type { Concept, LabRunArtifact } from "../../types";

type R = Record<string, unknown>;
const isRecord = (v: unknown): v is R => typeof v === "object" && v !== null && !Array.isArray(v);

interface SamplingCandidate {
  token: string;
  probability: number;
}

/**
 * Returns real viz props derived from a matching lab artifact when one
 * exists for the concept. Returns null when no real derivation path
 * applies, signalling the caller to fall back to synthetic demo data.
 *
 * Matching strategy: prefer an artifact whose `conceptId` matches the
 * concept; otherwise pick the first artifact whose shape satisfies
 * the viz key. This keeps the experiment surface populated even when
 * the user hasn't run a lab on this concept directly.
 */
export function tryDeriveRealProps(
  key: string | null,
  concept: Concept,
  recentArtifacts: LabRunArtifact[]
): Record<string, unknown> | null {
  if (!key) return null;

  const byConcept = recentArtifacts.find((a) => a.conceptId === concept.id)?.artifact;
  const candidates: unknown[] = byConcept !== undefined ? [byConcept] : [];
  for (const a of recentArtifacts) {
    if (a.conceptId !== concept.id) candidates.push(a.artifact);
  }

  switch (key) {
    case "attention-map": {
      for (const artifact of candidates) {
        if (!isRecord(artifact)) continue;
        const attention = isRecord(artifact.attention) ? artifact.attention : null;
        if (!attention) continue;
        const tokens = Array.isArray(attention.tokens) ? (attention.tokens as string[]) : null;
        const weights = Array.isArray(attention.weights) ? (attention.weights as number[][]) : null;
        if (!tokens || !weights) continue;
        const data: AttentionMatrix = { tokens, scores: weights };
        return { data };
      }
      return null;
    }
    case "loss-curve": {
      for (const artifact of candidates) {
        if (!isRecord(artifact)) continue;
        const training = isRecord(artifact.training) ? artifact.training : null;
        if (!training) continue;
        const history = Array.isArray(training.lossHistory) ? (training.lossHistory as number[]) : null;
        if (!history || history.length === 0) continue;
        return { series: [{ label: "train", values: history }], showRollingMean: true };
      }
      return null;
    }
    case "sampling-plot": {
      for (const artifact of candidates) {
        if (!isRecord(artifact)) continue;
        const training = isRecord(artifact.training) ? artifact.training : null;
        if (!training) continue;
        const probs = isRecord(training.finalProbabilities) ? training.finalProbabilities : null;
        if (!probs) continue;
        const entries = Object.entries(probs)
          .filter(([, v]) => typeof v === "number")
          .map(([token, probability]) => ({ token, probability: probability as number }));
        if (entries.length === 0) continue;
        entries.sort((a, b) => b.probability - a.probability);
        const top: SamplingCandidate[] = entries.slice(0, 6);
        return { candidates: top, selectedToken: top[0]?.token, temperature: 1.0 };
      }
      return null;
    }
    case "token-flow":
    case "token-flow-svg": {
      for (const artifact of candidates) {
        if (!isRecord(artifact)) continue;
        const tokens = Array.isArray(artifact.tokens) ? (artifact.tokens as unknown[]) : null;
        if (!tokens || tokens.length === 0) continue;
        const allStrings = tokens.every((t) => typeof t === "string");
        if (!allStrings) continue;
        const items: TokenItem[] = (tokens as string[]).map((text, i) => ({ id: 100 + i, text }));
        return { tokens: items };
      }
      return null;
    }
    default:
      // embedding-space and chat-playground have no real-data path yet.
      return null;
  }
}
