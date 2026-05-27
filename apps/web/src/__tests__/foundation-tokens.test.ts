import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const tokensCss = readFileSync(
  resolve(process.cwd(), "src/styles/tokens.css"),
  "utf8"
);

describe("design tokens", () => {
  it("exposes the cyan accent token on the dark theme", () => {
    expect(tokensCss).toMatch(/:root\[data-theme="dark"\]\s*\{[\s\S]*--accent:\s*#22d3ee/);
  });

  it("exposes the base background token under the dark theme scope", () => {
    expect(tokensCss).toMatch(/:root\[data-theme="dark"\]\s*\{[\s\S]*--bg-base:\s*#0b1220/);
  });
});
