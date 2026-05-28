import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolStep } from "../ToolStep";

describe("ToolStep", () => {
  it("renders tool, expression, result, and explanation", () => {
    render(
      <ToolStep
        toolTrace={{
          tool: "calculator",
          expression: "19 * 23",
          result: "437",
          explanation: "Verified arithmetic."
        }}
      />
    );
    expect(screen.getByText(/calculator/)).toBeInTheDocument();
    expect(screen.getByText(/19 \* 23/)).toBeInTheDocument();
    expect(screen.getByText("437")).toBeInTheDocument();
    expect(screen.getByText(/Verified arithmetic/)).toBeInTheDocument();
  });
});
