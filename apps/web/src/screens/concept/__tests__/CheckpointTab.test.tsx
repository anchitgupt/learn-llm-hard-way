import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckpointTab } from "../CheckpointTab";
import * as api from "../../../api";

const checkpoint = { question: "Why bytes?", answer: "Because text is encoded." };

beforeEach(() => {
  vi.spyOn(api, "submitCheckpoint").mockResolvedValue({
    conceptId: "bytes-unicode",
    submittedAnswer: "encoded",
    correct: true,
    feedback: "Checkpoint passed.",
    confidence: 4
  } as any);
  vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([] as any);
});
afterEach(() => vi.restoreAllMocks());

describe("CheckpointTab", () => {
  it("renders the question", () => {
    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={() => {}} />);
    expect(screen.getByText(/Why bytes\?/)).toBeInTheDocument();
  });

  it("submits answer + confidence and renders feedback", async () => {
    const onSubmitted = vi.fn();
    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={onSubmitted} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "encoded" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(screen.getByText(/Checkpoint passed/i)).toBeInTheDocument();
    expect(api.submitCheckpoint).toHaveBeenCalledWith("bytes-unicode", {
      submittedAnswer: "encoded",
      confidence: 3
    });
  });

  it("renders prior attempt history", async () => {
    vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([
      { conceptId: "bytes-unicode", submittedAnswer: "first try", correct: false, feedback: "no", confidence: 2 },
      { conceptId: "bytes-unicode", submittedAnswer: "second try", correct: true,  feedback: "yes", confidence: 4 }
    ] as any);

    render(<CheckpointTab conceptId="bytes-unicode" checkpoint={checkpoint} onSubmitted={() => {}} />);
    await waitFor(() => expect(screen.getByText(/first try/i)).toBeInTheDocument());
    expect(screen.getByText(/second try/i)).toBeInTheDocument();
  });
});
