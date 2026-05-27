export interface Checkpoint {
  question: string;
  answer: string;
  acceptedKeywords?: string[];
}

export interface Concept {
  id: string;
  title: string;
  order: number;
  prerequisites: string[];
  lessonPath: string;
  lessonMarkdown: string;
  lab: string | null;
  visual: string | null;
  checkpoint: Checkpoint;
  glossary: string[];
  status: string;
}

export interface Track {
  id: string;
  title: string;
  summary: string;
  order: number;
  concepts: Concept[];
}

export interface ProgressInput {
  status: string;
  confidence: number;
  note: string;
  revisit: boolean;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  shortDefinition: string;
  explanation: string;
  relatedConcepts: string[];
}

export interface ProgressRecord {
  conceptId: string;
  status: string;
  confidence: number;
  note: string;
  revisit: boolean;
}

export interface CheckpointAttemptInput {
  submittedAnswer: string;
  confidence: number;
}

export interface CheckpointAttempt {
  conceptId: string;
  submittedAnswer: string;
  correct: boolean;
  feedback: string;
  confidence: number;
}

export interface LabRunArtifact {
  labId: string;
  conceptId: string;
  artifactPath: string;
  artifact?: unknown;
  status: string;
  error: string;
}

export interface MissedTopic {
  conceptId: string;
  reason: string;
}

export interface ChatDemoInput {
  message: string;
  mode: "base" | "assistant";
  answerStyle: "short" | "scratch";
  toolMode: "none" | "verified";
  memoryMode: "context" | "saved";
  contextSize: number;
}

export interface ChatTrace {
  messages: Array<{ role: string; content: string }>;
  formattedPrompt: string;
  tokenTrace: Record<string, unknown>;
  contextTrace: Record<string, unknown>;
  samplingTrace: Array<Record<string, unknown>>;
  streamChunks: string[];
  toolTrace: Record<string, unknown> | null;
  memoryTrace: Record<string, unknown>;
  finalReply: string;
}

export interface ChatMemory {
  id: number;
  content: string;
  createdAt: string;
}

export interface FailureCase {
  id: string;
  category: string;
  prompt: string;
  modelOnlyOutput: string;
  explanation: string;
  betterStrategy: string;
  relatedConcepts: string[];
}

export interface PreferenceCandidate {
  id: string;
  response: string;
  traits: string[];
}

export interface PreferenceSimulation {
  prompt: string;
  candidates: PreferenceCandidate[];
  rewardScores: Record<string, number>;
  ranking: string[];
  winner: PreferenceCandidate;
  explanation: string;
}
