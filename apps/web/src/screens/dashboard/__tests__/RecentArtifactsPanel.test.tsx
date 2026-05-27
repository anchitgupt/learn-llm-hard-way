import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecentArtifactsPanel } from "../RecentArtifactsPanel";

describe("RecentArtifactsPanel", () => {
  it("renders empty state", () => {
    render(<MemoryRouter><RecentArtifactsPanel artifacts={[]} now={new Date()} /></MemoryRouter>);
    expect(screen.getByText(/No lab artifacts yet/i)).toBeInTheDocument();
  });

  it("renders artifact rows with their lab id and a View all link", () => {
    render(
      <MemoryRouter>
        <RecentArtifactsPanel
          artifacts={[
            { labId: "bpe-train", conceptId: "bpe", artifactPath: "artifacts/bpe.json", status: "ok", error: "", createdAt: "2026-05-27T11:00:00Z" } as any
          ]}
          now={new Date("2026-05-27T12:00:00Z")}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/bpe-train/i)).toBeInTheDocument();
    expect(screen.getByText(/1 h ago/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/i })).toHaveAttribute("href", "/artifacts");
  });
});
