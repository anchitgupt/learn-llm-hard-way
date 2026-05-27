import { describe, it, expect } from "vitest";
import { bandScale, linearScale, sequentialScale } from "../../primitives/scales";

describe("scales", () => {
  it("linearScale maps domain to range with d3-scale semantics", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });

  it("bandScale maps discrete domain to evenly spaced bands", () => {
    const s = bandScale(["a", "b", "c"], [0, 90], 0);
    expect(s("a")).toBe(0);
    expect(s("c")).toBe(60);
    expect(s.bandwidth()).toBe(30);
  });

  it("sequentialScale interpolates a CSS color string", () => {
    const s = sequentialScale([0, 1]);
    const at0 = s(0);
    const at1 = s(1);
    expect(typeof at0).toBe("string");
    expect(typeof at1).toBe("string");
    expect(at0).not.toBe(at1);
  });
});
