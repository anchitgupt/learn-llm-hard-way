import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenFlowSvg } from "../components/TokenFlowSvg";

describe("TokenFlowSvg", () => {
  it("renders accessible token flow visual", () => {
    render(<TokenFlowSvg />);

    expect(screen.getByRole("img", { name: "Token flow from text to ids" })).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("tokens")).toBeInTheDocument();
    expect(screen.getByText("ids")).toBeInTheDocument();
  });
});
