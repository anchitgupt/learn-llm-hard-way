import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Failures } from "../Failures";
import * as api from "../../api";
import type { FailureCase, PreferenceSimulation } from "../../types";

const failures: FailureCase[] = [
  { id: "f.1", category: "counting", prompt: "How many Rs?", modelOnlyOutput: "two", explanation: "It can't count letters reliably.", betterStrategy: "Use a tool.", relatedConcepts: ["c.token"] },
  { id: "f.2", category: "counting", prompt: "Letters in apple?", modelOnlyOutput: "six", explanation: "Same root cause.", betterStrategy: "Token-aware tool.", relatedConcepts: [] },
  { id: "f.3", category: "spelling", prompt: "Spell quay", modelOnlyOutput: "kay", explanation: "Bad alignment.", betterStrategy: "Phonetics.", relatedConcepts: [] }
];

const preference: PreferenceSimulation = {
  prompt: "Pick the politer reply.",
  candidates: [
    { id: "p.a", response: "Sure thing.", traits: ["polite"] },
    { id: "p.b", response: "Whatever.", traits: ["curt"] }
  ],
  rewardScores: { "p.a": 0.9, "p.b": 0.1 },
  ranking: ["p.a", "p.b"],
  winner: { id: "p.a", response: "Sure thing.", traits: ["polite"] },
  explanation: "Politeness scored higher."
};

beforeEach(() => {
  vi.spyOn(api, "fetchChatFailures").mockResolvedValue(failures);
  vi.spyOn(api, "fetchChatPreference").mockResolvedValue(preference);
});
afterEach(() => vi.restoreAllMocks());

describe("Failures", () => {
  it("renders a category section per failure category", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /counting/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /spelling/i })).toBeInTheDocument();
    });
  });

  it("clicking a failure card reveals explanation and strategy", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    const promptCard = await screen.findByText(/How many Rs\?/i);
    fireEvent.click(promptCard);
    expect(screen.getByText(/can't count letters reliably/i)).toBeInTheDocument();
    expect(screen.getByText(/^Use a tool\.$/)).toBeInTheDocument();
  });

  it("renders the PreferenceSection with the winner badged", async () => {
    render(<MemoryRouter><Failures /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Preference simulation/i })).toBeInTheDocument();
    });
    const winnerCard = screen.getByText(/Sure thing/).closest("[data-candidate]") as HTMLElement;
    expect(winnerCard).toHaveAttribute("data-winner", "true");
    const loserCard = screen.getByText(/Whatever/).closest("[data-candidate]") as HTMLElement;
    expect(loserCard).toHaveAttribute("data-winner", "false");
  });
});
