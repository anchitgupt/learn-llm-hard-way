export interface Checkpoint {
  question: string;
  answer: string;
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
