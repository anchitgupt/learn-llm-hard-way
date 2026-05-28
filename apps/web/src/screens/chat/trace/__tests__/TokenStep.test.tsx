import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TokenStep } from "../TokenStep";

describe("TokenStep", () => {
  it("renders one TokenFlow cell per token across the three stages", () => {
    const { container } = render(
      <TokenStep
        tokens={["a", "b", "c"]}
        tokenIds={[1, 2, 3]}
      />
    );
    // TokenFlow renders [data-token-cell] per (stage × token); 3 tokens × 3 stages = 9.
    expect(container.querySelectorAll("[data-token-cell]").length).toBe(9);
  });

  it("caps very long token sequences for layout sanity", () => {
    const tokens = Array.from({ length: 200 }, (_, i) => String(i));
    const ids = Array.from({ length: 200 }, (_, i) => i);
    const { container } = render(<TokenStep tokens={tokens} tokenIds={ids} />);
    // TokenStep caps to a maximum of 80 tokens shown × 3 stages.
    expect(container.querySelectorAll("[data-token-cell]").length).toBeLessThanOrEqual(80 * 3);
  });
});
