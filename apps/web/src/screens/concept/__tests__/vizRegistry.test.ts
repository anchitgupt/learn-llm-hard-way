import { describe, it, expect } from "vitest";
import { registeredKeys, resolveViz } from "../vizRegistry";

describe("vizRegistry", () => {
  it("registers all six concept viz keys", () => {
    expect(registeredKeys).toEqual([
      "token-flow",
      "attention-map",
      "loss-curve",
      "sampling-plot",
      "embedding-space",
      "chat-playground"
    ]);
  });

  it("resolves each known key to an entry with Component and hint", () => {
    for (const key of registeredKeys) {
      const entry = resolveViz(key);
      expect(entry).not.toBeNull();
      expect(typeof entry?.Component).toBe("function");
      expect(typeof entry?.hint).toBe("string");
      expect((entry?.hint ?? "").length).toBeGreaterThan(0);
    }
  });

  it("returns null for unknown or null keys", () => {
    expect(resolveViz(null)).toBeNull();
    expect(resolveViz(undefined)).toBeNull();
    expect(resolveViz("")).toBeNull();
    expect(resolveViz("nope")).toBeNull();
  });

  it("treats 'token-flow-svg' as an alias for 'token-flow' during the migration", () => {
    const canonical = resolveViz("token-flow");
    const alias = resolveViz("token-flow-svg");
    expect(alias).not.toBeNull();
    expect(alias?.Component).toBe(canonical?.Component);
  });
});
