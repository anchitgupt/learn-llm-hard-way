import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KBD } from "../kbd";

describe("KBD", () => {
  it("renders inside a <kbd> element with the mono class", () => {
    render(<KBD>Cmd+K</KBD>);
    const el = screen.getByText("Cmd+K");
    expect(el.tagName).toBe("KBD");
    expect(el.className).toMatch(/font-mono/);
  });
});
