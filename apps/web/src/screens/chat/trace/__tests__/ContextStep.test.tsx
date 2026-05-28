import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContextStep } from "../ContextStep";

describe("ContextStep", () => {
  it("shows kept and dropped token counts plus the context size", () => {
    render(
      <ContextStep
        contextSize={96}
        keptTokens={Array.from({ length: 84 }, (_, i) => String(i))}
        droppedTokens={Array.from({ length: 12 }, (_, i) => "d" + i)}
      />
    );
    expect(screen.getByText(/84/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/96/)).toBeInTheDocument();
  });

  it("renders the usage meter width proportional to kept / contextSize", () => {
    const { container } = render(
      <ContextStep
        contextSize={100}
        keptTokens={Array.from({ length: 25 }, (_, i) => String(i))}
        droppedTokens={[]}
      />
    );
    const bar = container.querySelector("[data-context-meter]");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("style") ?? "").toMatch(/width:\s*25%/);
  });
});
