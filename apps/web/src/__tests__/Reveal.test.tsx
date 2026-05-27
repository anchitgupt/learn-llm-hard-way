import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "../lib/motion";

describe("Reveal", () => {
  it("renders its children", () => {
    render(<Reveal><span>hello</span></Reveal>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a plain div when prefers-reduced-motion is set", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<Reveal data-testid="reveal"><span>x</span></Reveal>);
    const wrapper = container.firstElementChild;
    expect(wrapper?.tagName).toBe("DIV");
    expect(wrapper?.getAttribute("style") ?? "").not.toContain("opacity");

    window.matchMedia = originalMatchMedia;
  });
});
