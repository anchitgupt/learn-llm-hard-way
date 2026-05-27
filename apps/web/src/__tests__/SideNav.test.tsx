import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SideNav } from "../shell/SideNav";
import { CourseDataProvider } from "../shell/CourseDataProvider";
import * as api from "../api";
import type { Concept, Track } from "../types";

beforeEach(() => {
  window.localStorage.clear();
});

describe("SideNav (standalone — no provider)", () => {
  it("renders one nav entry per static primary screen", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    // The dynamic "Concept" entry only renders when a CourseDataProvider
    // is mounted and a continueConcept is available; the SideNav itself
    // degrades gracefully outside a provider.
    for (const label of ["Today", "Tracks", "Concept Map", "Chat", "Glossary", "Artifacts", "Failures", "Viz"]) {
      expect(screen.getByRole("link", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
    // Make sure the dynamic Concept entry is NOT rendered standalone.
    expect(screen.queryByRole("link", { name: /^Concept$/i })).not.toBeInTheDocument();
  });

  it("toggles collapsed state and persists it to localStorage", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBe("true");
  });
});

describe("SideNav (with CourseDataProvider)", () => {
  const track: Track = {
    id: "data-and-tokens",
    title: "Data and Tokens",
    summary: "",
    order: 1,
    concepts: [{ id: "bytes-unicode", title: "Bytes & Unicode" } as unknown as Concept]
  };

  beforeEach(() => {
    vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
    vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
  });

  afterEach(() => vi.restoreAllMocks());

  it("injects a dynamic Concept entry pointing at the current concept", async () => {
    render(
      <MemoryRouter>
        <CourseDataProvider>
          <SideNav />
        </CourseDataProvider>
      </MemoryRouter>
    );
    const link = await waitFor(() =>
      screen.getByRole("link", { name: /^Concept$/i })
    );
    expect(link).toHaveAttribute("href", "/concepts/bytes-unicode");
  });
});
