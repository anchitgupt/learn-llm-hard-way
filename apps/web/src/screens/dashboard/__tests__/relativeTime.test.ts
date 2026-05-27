import { describe, it, expect } from "vitest";
import { relativeTime } from "../relativeTime";

describe("relativeTime", () => {
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns 'just now' under 60 seconds", () => {
    expect(relativeTime(new Date("2026-05-27T11:59:30Z"), now)).toBe("just now");
  });
  it("returns minutes for under one hour", () => {
    expect(relativeTime(new Date("2026-05-27T11:30:00Z"), now)).toBe("30 m ago");
  });
  it("returns hours for under one day", () => {
    expect(relativeTime(new Date("2026-05-27T09:00:00Z"), now)).toBe("3 h ago");
  });
  it("returns days for under one week", () => {
    expect(relativeTime(new Date("2026-05-25T12:00:00Z"), now)).toBe("2 d ago");
  });
  it("returns the ISO date for older entries", () => {
    expect(relativeTime(new Date("2026-04-01T12:00:00Z"), now)).toBe("2026-04-01");
  });
});
