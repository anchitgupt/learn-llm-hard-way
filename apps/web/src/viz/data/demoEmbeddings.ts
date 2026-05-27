import type { EmbeddingPoint } from "./types";

/**
 * Hand-curated 2D points for the /viz showcase. Three clusters:
 * numbers near (1, 1), animals near (3, 3), verbs near (5, 1).
 * Replace with real lab output (same shape) when an embeddings lab lands.
 */
export const demoEmbeddings: EmbeddingPoint[] = [
  // numbers
  { id: "one", x: 1.0, y: 1.0, label: "one", cluster: "numbers" },
  { id: "two", x: 1.2, y: 1.1, label: "two", cluster: "numbers" },
  { id: "three", x: 0.9, y: 1.3, label: "three", cluster: "numbers" },
  { id: "four", x: 1.1, y: 0.8, label: "four", cluster: "numbers" },
  { id: "five", x: 1.3, y: 1.2, label: "five", cluster: "numbers" },
  { id: "six", x: 0.8, y: 1.1, label: "six", cluster: "numbers" },
  { id: "seven", x: 1.0, y: 1.4, label: "seven", cluster: "numbers" },
  { id: "eight", x: 1.4, y: 1.0, label: "eight", cluster: "numbers" },
  { id: "nine", x: 1.2, y: 0.9, label: "nine", cluster: "numbers" },
  { id: "ten", x: 0.95, y: 1.15, label: "ten", cluster: "numbers" },

  // animals
  { id: "cat", x: 3.0, y: 3.0, label: "cat", cluster: "animals" },
  { id: "dog", x: 3.2, y: 3.1, label: "dog", cluster: "animals" },
  { id: "bird", x: 2.8, y: 3.3, label: "bird", cluster: "animals" },
  { id: "fish", x: 3.1, y: 2.7, label: "fish", cluster: "animals" },
  { id: "horse", x: 3.3, y: 3.2, label: "horse", cluster: "animals" },
  { id: "cow", x: 2.9, y: 2.9, label: "cow", cluster: "animals" },
  { id: "lion", x: 3.4, y: 3.0, label: "lion", cluster: "animals" },
  { id: "tiger", x: 3.5, y: 3.1, label: "tiger", cluster: "animals" },
  { id: "wolf", x: 3.2, y: 2.8, label: "wolf", cluster: "animals" },
  { id: "bear", x: 2.7, y: 3.0, label: "bear", cluster: "animals" },

  // verbs
  { id: "run", x: 5.0, y: 1.0, label: "run", cluster: "verbs" },
  { id: "jump", x: 5.2, y: 1.1, label: "jump", cluster: "verbs" },
  { id: "walk", x: 4.8, y: 1.2, label: "walk", cluster: "verbs" },
  { id: "swim", x: 5.1, y: 0.9, label: "swim", cluster: "verbs" },
  { id: "fly", x: 5.3, y: 1.3, label: "fly", cluster: "verbs" },
  { id: "eat", x: 4.9, y: 0.8, label: "eat", cluster: "verbs" },
  { id: "sleep", x: 5.2, y: 1.4, label: "sleep", cluster: "verbs" },
  { id: "write", x: 5.4, y: 1.0, label: "write", cluster: "verbs" },
  { id: "read", x: 5.0, y: 1.3, label: "read", cluster: "verbs" },
  { id: "speak", x: 4.7, y: 1.1, label: "speak", cluster: "verbs" }
];
