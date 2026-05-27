import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LabTab } from "../LabTab";
import * as api from "../../../api";

const labArtifact = {
  labId: "character-tokenizer",
  conceptId: "character-tokenization",
  artifactPath: "artifacts/labs/character-tokenizer.json",
  status: "ok",
  error: ""
};

beforeEach(() => {
  vi.spyOn(api, "runLab").mockResolvedValue(labArtifact as any);
});
afterEach(() => vi.restoreAllMocks());

describe("LabTab", () => {
  it("renders the lab id and run button when concept.lab is set", () => {
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/character-tokenizer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run lab/i })).toBeInTheDocument();
  });

  it("disables the run button while running and re-enables on success", async () => {
    const onRunComplete = vi.fn();
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={onRunComplete} />
      </MemoryRouter>
    );
    const button = screen.getByRole("button", { name: /run lab/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(onRunComplete).toHaveBeenCalled());
    expect(button).not.toBeDisabled();
  });

  it("renders an inline alert on run failure with a retry button", async () => {
    vi.spyOn(api, "runLab").mockRejectedValueOnce(new Error("lab blew up"));
    render(
      <MemoryRouter>
        <LabTab labId="character-tokenizer" conceptId="character-tokenization" onRunComplete={() => {}} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /run lab/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/lab blew up/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
