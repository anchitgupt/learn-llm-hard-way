import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserStep } from "../UserStep";

describe("UserStep", () => {
  it("extracts the last user message from the messages array", () => {
    render(
      <UserStep
        messages={[
          { role: "system", content: "system prompt" },
          { role: "user", content: "earlier" },
          { role: "user", content: "What is 19 * 23?" }
        ]}
      />
    );
    expect(screen.getByText("What is 19 * 23?")).toBeInTheDocument();
    // Does not render the system message.
    expect(screen.queryByText(/system prompt/)).not.toBeInTheDocument();
  });

  it("renders an empty state when no user message is present", () => {
    render(<UserStep messages={[{ role: "system", content: "x" }]} />);
    expect(screen.getByText(/No user message/i)).toBeInTheDocument();
  });
});
