import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MigrationBanner } from "../shell/MigrationBanner";

describe("MigrationBanner", () => {
  it("announces the migration with the right sub-project number", () => {
    render(<MigrationBanner scheduledIn={5} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Migration in progress/i);
    expect(status).toHaveTextContent(/sub-project 5/i);
  });

  it("renders an optional note when provided", () => {
    render(<MigrationBanner scheduledIn={4} note="Concept Workspace is still styled by the old CSS." />);
    expect(screen.getByRole("status")).toHaveTextContent(/old CSS/i);
  });
});
