import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseDataProvider } from "../../shell/CourseDataProvider";
import { Dashboard } from "../Dashboard";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode", summary: "Begin at the bottom." } as unknown as Concept
  ]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("Dashboard", () => {
  it("renders all four sections after data loads", async () => {
    render(
      <MemoryRouter>
        <CourseDataProvider>
          <Dashboard />
        </CourseDataProvider>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Bytes & Unicode/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: /Missed topics/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Recent artifacts/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Data and Tokens/i).length).toBeGreaterThan(0);
  });
});
