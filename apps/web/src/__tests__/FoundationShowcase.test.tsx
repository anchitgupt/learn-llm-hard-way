import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoundationShowcase } from "../components/FoundationShowcase";

describe("FoundationShowcase", () => {
  it("renders a heading and at least one Button primitive", () => {
    render(<FoundationShowcase />);
    expect(screen.getByRole("heading", { name: /design foundation/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("renders the cyan accent swatch with its hex code", () => {
    render(<FoundationShowcase />);
    expect(screen.getByText("#22d3ee")).toBeInTheDocument();
  });
});
