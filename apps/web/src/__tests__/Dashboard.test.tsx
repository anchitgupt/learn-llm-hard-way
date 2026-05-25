import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "../components/Dashboard";
import type { LabRunArtifact, MissedTopic, Track } from "../types";

const tracks: Track[] = [{ id: "math", title: "Math", summary: "Math track", order: 1, concepts: [] }];
const missedTopics: MissedTopic[] = [{ conceptId: "vectors", reason: "low-confidence" }];
const artifacts: LabRunArtifact[] = [
  {
    labId: "math-vector-demo",
    conceptId: "vectors",
    artifactPath: "artifacts/labs/math-vector-demo.json",
    status: "passed",
    error: ""
  }
];

describe("Dashboard", () => {
  it("shows missed topics and recent artifacts", () => {
    render(
      <Dashboard
        tracks={tracks}
        selectedConceptId={null}
        missedTopics={missedTopics}
        recentArtifacts={artifacts}
        onSelectConcept={() => undefined}
      />
    );

    expect(screen.getByText("Missed Topics")).toBeInTheDocument();
    expect(screen.getByText("vectors - low-confidence")).toBeInTheDocument();
    expect(screen.getByText("math-vector-demo")).toBeInTheDocument();
  });
});
