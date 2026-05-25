import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckpointPanel } from "../components/CheckpointPanel";

describe("CheckpointPanel", () => {
  it("submits answer and shows feedback", async () => {
    const onSubmit = vi.fn(async () => ({
      conceptId: "vectors",
      submittedAnswer: "numbers",
      correct: false,
      feedback: "Mention ordered numbers.",
      confidence: 2
    }));

    render(<CheckpointPanel question="What is a vector?" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Checkpoint answer"), "numbers");
    await userEvent.selectOptions(screen.getByLabelText("Confidence"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Submit checkpoint" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Mention ordered numbers.");
  });
});
