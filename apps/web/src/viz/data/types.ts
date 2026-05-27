export interface TokenItem {
  id: number | string;
  text: string;
  bytes?: number[];
}

export interface EmbeddingPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  cluster?: string;
}

export interface LossSeries {
  label: string;
  values: number[];
}

export interface AttentionMatrix {
  tokens: string[];
  scores: number[][]; // -Infinity entries are masked
}
