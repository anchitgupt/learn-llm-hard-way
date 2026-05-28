import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TraceStep } from "../TraceStep";

describe("TraceStep", () => {
  it("renders the eyebrow with step number + total and the name", () => {
    render(
      <TraceStep number={3} total={8} name="Tokenization" hint="Where text becomes ids">
        <p>child</p>
      </TraceStep>
    );
    expect(screen.getByText(/Step 3 of 8/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tokenization/ })).toBeInTheDocument();
    expect(screen.getByText("Where text becomes ids")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("hides the hint when not provided", () => {
    render(
      <TraceStep number={1} total={8} name="User">
        <p>child</p>
      </TraceStep>
    );
    expect(screen.queryByText(/Where text/)).not.toBeInTheDocument();
  });
});
