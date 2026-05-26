import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LabPanel } from "../components/LabPanel";

describe("LabPanel", () => {
  it("runs a lab and shows artifact path", async () => {
    const onRun = vi.fn(async () => ({
      labId: "math-vector-demo",
      conceptId: "vectors",
      artifactPath: "artifacts/labs/math-vector-demo.json",
      status: "passed",
      error: "",
      artifact: {
        generation: {
          generatedText: "llm lab"
        }
      }
    }));

    render(<LabPanel labId="math-vector-demo" onRun={onRun} />);

    await userEvent.click(screen.getByRole("button", { name: "Run lab" }));

    expect(await screen.findByRole("status")).toHaveTextContent("artifacts/labs/math-vector-demo.json");
    expect(await screen.findByText("Generated text")).toBeInTheDocument();
    expect(screen.getByText("llm lab")).toBeInTheDocument();
  });
});
