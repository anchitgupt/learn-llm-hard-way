import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatReply } from "../ChatReply";

describe("ChatReply", () => {
  it("renders the empty state when no trace is present", () => {
    render(<ChatReply finalReply={null} loading={false} error={null} onRetry={() => {}} />);
    expect(screen.getByText(/Send a message to see how it flows/i)).toBeInTheDocument();
  });

  it("renders the final reply as an assistant bubble", () => {
    render(<ChatReply finalReply="The answer is 437." loading={false} error={null} onRetry={() => {}} />);
    expect(screen.getByText("The answer is 437.")).toBeInTheDocument();
  });

  it("renders an error alert with a Retry button", () => {
    const onRetry = vi.fn();
    render(<ChatReply finalReply={null} loading={false} error="offline" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/i);
    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders a skeleton overlay when loading and no prior reply", () => {
    const { container } = render(<ChatReply finalReply={null} loading={true} error={null} onRetry={() => {}} />);
    expect(container.querySelector("[data-skeleton]")).not.toBeNull();
  });
});
