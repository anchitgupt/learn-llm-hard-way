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
  status: string;
  error: string;
}

export interface MissedTopic {
  conceptId: string;
  reason: string;
}
