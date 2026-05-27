import { beforeEach, describe, it, expect } from "vitest";
import { __resetColorCaches, categoricalColor, magnitudeRamp, maskedColor } from "../../primitives/colors";

describe("colors", () => {
  beforeEach(() => {
    for (const token of [
      "--bg-inset",
      "--accent",
      "--success",
      "--border-subtle"
    ]) {
      document.documentElement.style.removeProperty(token);
    }
    __resetColorCaches();
  });

  it("magnitudeRamp returns a non-empty string for 0 and 1", () => {
    const lo = magnitudeRamp(0);
    const hi = magnitudeRamp(1);
    expect(typeof lo).toBe("string");
    expect(typeof hi).toBe("string");
    expect(lo.length).toBeGreaterThan(0);
    expect(hi).not.toBe(lo);
  });

  it("magnitudeRamp clamps inputs outside 0..1", () => {
    expect(magnitudeRamp(-1)).toBe(magnitudeRamp(0));
    expect(magnitudeRamp(2)).toBe(magnitudeRamp(1));
  });

  it("categoricalColor cycles deterministically", () => {
    expect(categoricalColor(0)).toBe(categoricalColor(0));
    expect(categoricalColor(0)).not.toBe(categoricalColor(1));
    expect(categoricalColor(0)).toBe(categoricalColor(8));
  });

  it("maskedColor returns a deterministic CSS color string", () => {
    expect(maskedColor()).toBe(maskedColor());
    expect(typeof maskedColor()).toBe("string");
  });

  it("magnitudeRamp reads CSS token endpoints", () => {
    document.documentElement.style.setProperty("--bg-inset", "#010203");
    document.documentElement.style.setProperty("--accent", "#0a0b0c");
    __resetColorCaches();

    expect(magnitudeRamp(0)).toBe("rgb(1, 2, 3)");
    expect(magnitudeRamp(1)).toBe("rgb(10, 11, 12)");
  });

  it("categoricalColor and maskedColor read CSS tokens", () => {
    document.documentElement.style.setProperty("--success", "#112233");
    document.documentElement.style.setProperty("--border-subtle", "#334455");
    __resetColorCaches();

    expect(categoricalColor(1)).toBe("#112233");
    expect(maskedColor()).toBe("#334455");
  });
});
