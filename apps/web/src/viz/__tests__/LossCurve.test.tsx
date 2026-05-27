import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LossCurve } from "../LossCurve";

const train = { label: "train", values: [2.0, 1.5, 1.0, 0.7, 0.5] };
const val   = { label: "val",   values: [2.2, 1.7, 1.2, 0.9, 0.8] };

describe("LossCurve", () => {
  it("renders one path per series", () => {
    const { container } = render(<LossCurve series={[train, val]} />);
    expect(container.querySelectorAll("[data-series]").length).toBe(2);
  });

  it("respects an explicit yMax", () => {
    const { container } = render(<LossCurve series={[train]} yMax={5} />);
    expect(container.firstElementChild?.getAttribute("data-y-max")).toBe("5");
  });

  it("renders a rolling-mean overlay when showRollingMean is true", () => {
    const { container } = render(<LossCurve series={[train]} showRollingMean />);
    expect(container.querySelector("[data-rolling-mean]")).not.toBeNull();
  });

  it("falls back to index steps when explicit steps length does not match values", () => {
    const { container } = render(<LossCurve series={[train]} steps={[100, 200]} />);
    const path = container.querySelector("[data-series]")?.getAttribute("d") ?? "";
    expect(path).not.toContain("200");
  });

  it("uses one step strategy across mixed-length series", () => {
    const short = { label: "short", values: [1, 0.5] };
    const { container } = render(<LossCurve series={[train, short]} steps={[100, 200]} />);
    const shortPath = container.querySelector("[data-series='short']")?.getAttribute("d") ?? "";
    const xs = Array.from(shortPath.matchAll(/[ML](-?\d+(?:\.\d+)?),/g)).map(
      ([, x]) => Number(x)
    );
    expect(Math.max(...xs)).toBeLessThan(1000);
  });

  it("renders an empty state when no series are provided", () => {
    const { getByText } = render(<LossCurve series={[]} />);
    expect(getByText(/no series yet/i)).toBeInTheDocument();
  });
});
