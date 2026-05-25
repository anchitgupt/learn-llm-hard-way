import type {
  CheckpointAttempt,
  CheckpointAttemptInput,
  GlossaryEntry,
  LabRunArtifact,
  MissedTopic,
  ProgressInput,
  ProgressRecord,
  Track
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTracks(): Promise<Track[]> {
  return readJson<Track[]>(await fetch(`${API_BASE}/api/tracks`));
}

export async function fetchGlossary(): Promise<GlossaryEntry[]> {
  return readJson<GlossaryEntry[]>(await fetch(`${API_BASE}/api/glossary`));
}

export async function fetchProgress(): Promise<ProgressRecord[]> {
  return readJson<ProgressRecord[]>(await fetch(`${API_BASE}/api/progress`));
}

export async function saveProgress(conceptId: string, input: ProgressInput): Promise<unknown> {
  return readJson(
    await fetch(`${API_BASE}/api/progress/${conceptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function submitCheckpoint(
  conceptId: string,
  input: CheckpointAttemptInput
): Promise<CheckpointAttempt> {
  return readJson<CheckpointAttempt>(
    await fetch(`${API_BASE}/api/checkpoints/${conceptId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function runLab(labId: string): Promise<LabRunArtifact> {
  return readJson<LabRunArtifact>(
    await fetch(`${API_BASE}/api/labs/${labId}/runs`, {
      method: "POST"
    })
  );
}

export async function fetchRecentArtifacts(): Promise<LabRunArtifact[]> {
  return readJson<LabRunArtifact[]>(await fetch(`${API_BASE}/api/artifacts/recent`));
}

export async function fetchMissedTopics(): Promise<MissedTopic[]> {
  return readJson<MissedTopic[]>(await fetch(`${API_BASE}/api/revisit`));
}
