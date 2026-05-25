import type { ProgressInput, Track } from "./types";

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

export async function saveProgress(conceptId: string, input: ProgressInput): Promise<unknown> {
  return readJson(
    await fetch(`${API_BASE}/api/progress/${conceptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}
