import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SamplingPlot } from "../SamplingPlot";

const candidates = [
  { token: "the", probability: 0.51 },
  { token: "a", probability: 0.30 },
  { token: "an", probability: 0.19 }
];

describe("SamplingPlot", () => {
  it("renders one bar per candidate", () => {
    const { container } = render(<SamplingPlot candidates={candidates} />);
    expect(container.querySelectorAll("[data-bar]").length).toBe(3);
  });

  it("caps the number of bars at topK", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      token: `t${i}`,
      probability: 1 / (i + 1)
    }));
    const { container } = render(<SamplingPlot candidates={many} topK={5} />);
    expect(container.querySelectorAll("[data-bar]").length).toBe(5);
  });

  it("flags the selected token with data-selected", () => {
    const { container } = render(
      <SamplingPlot candidates={candidates} selectedToken="a" />
    );
    const selected = container.querySelectorAll("[data-bar][data-selected='true']");
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute("data-token")).toBe("a");
  });

  it("sorts bars by probability descending", () => {
    const shuffled = [
      { token: "x", probability: 0.1 },
      { token: "y", probability: 0.6 },
      { token: "z", probability: 0.3 }
    ];
    const { container } = render(<SamplingPlot candidates={shuffled} />);
    const tokens = Array.from(container.querySelectorAll("[data-bar]"))
      .map((b) => b.getAttribute("data-token"));
    expect(tokens).toEqual(["y", "z", "x"]);
  });

  it("truncates long visible token labels while keeping the full token in data", () => {
    const long = "extremely-long-token-label-that-would-overflow";
    const { container } = render(<SamplingPlot candidates={[{ token: long, probability: 1 }]} />);
    const bar = container.querySelector("[data-bar]");
    const label = container.querySelector("text[data-token-label]");
    expect(bar?.getAttribute("data-token")).toBe(long);
    expect(label?.getAttribute("data-visible-label")?.length).toBeLessThan(long.length);
    expect(label?.getAttribute("data-visible-label")?.length).toBeLessThanOrEqual(9);
  });

  it("keeps full-width probability labels inside the plot", () => {
    const { container } = render(<SamplingPlot candidates={[{ token: "certain", probability: 1 }]} />);
    const probability = container.querySelector("text[data-probability-label]");
    expect(probability).toHaveAttribute("text-anchor", "end");
  });
});
