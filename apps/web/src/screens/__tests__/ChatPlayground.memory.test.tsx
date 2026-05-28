import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatPlayground } from "../ChatPlayground";
import * as api from "../../api";
import type { ChatMemory } from "../../types";

const baseMemories: ChatMemory[] = [
  { id: 1, content: "user prefers tabs", createdAt: "2026-05-28T10:00:00Z" },
  { id: 2, content: "user is in IST",   createdAt: "2026-05-28T11:00:00Z" }
];

beforeEach(() => {
  vi.spyOn(api, "fetchChatMemory").mockResolvedValue([...baseMemories]);
  vi.spyOn(api, "saveChatMemory").mockImplementation(async (content: string) => ({
    id: 3, content, createdAt: "2026-05-28T12:00:00Z"
  }));
  vi.spyOn(api, "deleteChatMemory").mockResolvedValue();
  vi.spyOn(api, "runChatDemo").mockResolvedValue({} as never);
});
afterEach(() => vi.restoreAllMocks());

describe("ChatPlayground memory drawer", () => {
  it("opens the drawer when Memories is clicked and lists current memories", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    await waitFor(() => {
      expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
    });
    expect(within(drawer).getByText(/user is in IST/)).toBeInTheDocument();
  });

  it("saving a new memory calls saveChatMemory and refreshes the list", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    const textarea = within(drawer).getByRole("textbox", { name: /new memory/i });
    fireEvent.change(textarea, { target: { value: "remember timezone" } });
    fireEvent.click(within(drawer).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(api.saveChatMemory).toHaveBeenCalledWith("remember timezone"));
  });

  it("clicking trash on a memory calls deleteChatMemory and removes it", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    await waitFor(() => {
      expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
    });
    const row = within(drawer).getByText(/user prefers tabs/).closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /delete memory 1/i }));
    await waitFor(() => expect(api.deleteChatMemory).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(within(drawer).queryByText(/user prefers tabs/)).not.toBeInTheDocument()
    );
  });

  it("failed delete restores the row and shows an inline alert", async () => {
    (api.deleteChatMemory as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(
      new Error("network down")
    );
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /Memories/i }));
    const drawer = await screen.findByRole("dialog", { name: /Saved memories/i });
    await waitFor(() => {
      expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
    });
    const row = within(drawer).getByText(/user prefers tabs/).closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /delete memory 1/i }));
    await waitFor(() =>
      expect(within(drawer).getByText(/Couldn't delete memory/i)).toBeInTheDocument()
    );
    expect(within(drawer).getByText(/user prefers tabs/)).toBeInTheDocument();
  });
});
