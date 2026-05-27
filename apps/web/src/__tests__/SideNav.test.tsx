import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SideNav } from "../shell/SideNav";

beforeEach(() => {
  window.localStorage.clear();
});

describe("SideNav", () => {
  it("renders one nav entry per primary screen", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    for (const label of ["Today", "Tracks", "Concept Map", "Concept", "Chat", "Glossary", "Artifacts", "Failures"]) {
      expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toBeInTheDocument();
    }
  });

  it("toggles collapsed state and persists it to localStorage", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(window.localStorage.getItem("learn-llm.sidebar.collapsed")).toBe("true");
  });
});
