import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MissedTopicsPanel } from "../MissedTopicsPanel";

describe("MissedTopicsPanel", () => {
  it("renders the empty state when no missed topics", () => {
    render(<MemoryRouter><MissedTopicsPanel missedTopics={[]} /></MemoryRouter>);
    expect(screen.getByText(/haven't missed anything/i)).toBeInTheDocument();
  });

  it("renders each missed topic with its reason badge", () => {
    render(
      <MemoryRouter>
        <MissedTopicsPanel
          missedTopics={[
            { conceptId: "vectors", reason: "low-confidence" },
            { conceptId: "softmax", reason: "failed-checkpoint" }
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("vectors")).toBeInTheDocument();
    expect(screen.getByText("low-confidence")).toBeInTheDocument();
    expect(screen.getByText("softmax")).toBeInTheDocument();
    expect(screen.getByText("failed-checkpoint")).toBeInTheDocument();
  });

  it("View all link points to /concepts?filter=missed", () => {
    render(
      <MemoryRouter>
        <MissedTopicsPanel missedTopics={[{ conceptId: "x", reason: "low-confidence" }]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /View all/i }))
      .toHaveAttribute("href", "/concepts?filter=missed");
  });
});
