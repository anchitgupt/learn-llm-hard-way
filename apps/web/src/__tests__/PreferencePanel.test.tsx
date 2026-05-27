import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreferencePanel } from "../components/PreferencePanel";

describe("PreferencePanel", () => {
  it("renders winner and reward scores", () => {
    render(
      <PreferencePanel
        simulation={{
          prompt: "Explain why tool verification helps arithmetic.",
          candidates: [
            { id: "guessy", response: "Probably correct.", traits: ["unsupported"] },
            { id: "verified", response: "The tool computes it.", traits: ["grounded"] }
          ],
          rewardScores: { guessy: 0.15, verified: 0.92 },
          ranking: ["verified", "guessy"],
          winner: { id: "verified", response: "The tool computes it.", traits: ["grounded"] },
          explanation: "The verifiable response wins."
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Preference Simulation" })).toBeInTheDocument();
    expect(screen.getByText("Winner: verified")).toBeInTheDocument();
    expect(screen.getByText("verified: 0.92")).toBeInTheDocument();
  });
});
