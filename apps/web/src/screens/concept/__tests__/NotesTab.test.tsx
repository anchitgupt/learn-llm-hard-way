import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotesTab } from "../NotesTab";
import * as api from "../../../api";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(api, "saveProgress").mockResolvedValue({} as any);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("NotesTab", () => {
  it("renders existing note as initial textarea value", () => {
    render(<NotesTab conceptId="x" existing={{ conceptId: "x", status: "learning", confidence: 3, note: "earlier note", revisit: false }} onSaved={() => {}} />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("earlier note");
  });

  it("debounces typing and calls saveProgress", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new" } });
    expect(api.saveProgress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(api.saveProgress).toHaveBeenCalledTimes(1);
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ note: "new" }));
  });

  it("toggling revisit triggers an immediate save", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: /revisit/i }));
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ revisit: true }));
  });

  it("'Mark complete' sets status=complete", () => {
    render(<NotesTab conceptId="x" existing={undefined} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(api.saveProgress).toHaveBeenCalledWith("x", expect.objectContaining({ status: "complete" }));
  });
});
