import type { ComponentType } from "react";
import { AttentionMap, EmbeddingSpace, LossCurve, SamplingPlot, TokenFlow } from "@/viz";
import { ChatPlayground } from "@/components/ChatPlayground";

export type ConceptVizKey =
  | "token-flow"
  | "attention-map"
  | "loss-curve"
  | "sampling-plot"
  | "embedding-space"
  | "chat-playground";

export interface RegistryEntry {
  Component: ComponentType<any>;
  hint: string;
}

const registry: Record<ConceptVizKey, RegistryEntry> = {
  "token-flow":      { Component: TokenFlow,      hint: "Tokens through stages: text, tokens, ids." },
  "attention-map":   { Component: AttentionMap,   hint: "Attention scores between query and key tokens." },
  "loss-curve":      { Component: LossCurve,      hint: "Training loss over steps. Lower is better." },
  "sampling-plot":   { Component: SamplingPlot,   hint: "Probabilities over candidate next tokens." },
  "embedding-space": { Component: EmbeddingSpace, hint: "Two-dimensional projection of embedding vectors." },
  "chat-playground": { Component: ChatPlayground, hint: "Send a message and inspect every step in the chat trace." }
};

// Migration-window aliases. Removed in Task 5 once every concept JSON
// has been updated to the canonical keys above.
const aliases: Record<string, ConceptVizKey> = {
  "token-flow-svg": "token-flow"
};

export function resolveViz(key: string | null | undefined): RegistryEntry | null {
  if (!key) return null;
  const canonical = (aliases[key] ?? key) as ConceptVizKey;
  return (registry as Record<string, RegistryEntry | undefined>)[canonical] ?? null;
}

export const registeredKeys = Object.keys(registry) as ConceptVizKey[];
