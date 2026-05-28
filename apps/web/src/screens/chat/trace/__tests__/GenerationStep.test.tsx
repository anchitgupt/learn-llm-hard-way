import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenerationStep } from "../GenerationStep";

describe("GenerationStep", () => {
  it("renders the generation explanation", () => {
    render(<GenerationStep />);
    expect(screen.getByText(/model.generate/i)).toBeInTheDocument();
  });
});
