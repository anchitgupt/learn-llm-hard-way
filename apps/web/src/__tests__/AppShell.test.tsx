import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import * as api from "../api";

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("AppShell", () => {
  it("renders header, sidebar, and the route outlet", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<p data-testid="route-content">home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId("route-content")).toBeInTheDocument());
    expect(screen.getByText(/Learn LLM/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Primary/i })).toBeInTheDocument();
  });

  it("shows an error banner with a Retry button when the initial fetch fails", async () => {
    vi.spyOn(api, "fetchTracks").mockRejectedValueOnce(new Error("network down"));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<p>home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Couldn't load course data/i);
    expect(alert).toHaveTextContent(/network down/);
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
