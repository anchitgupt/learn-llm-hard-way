import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { MapControls } from "../MapControls";

beforeEach(() => {
  window.localStorage.clear();
});

function CurrentSearch() {
  const { search } = useLocation();
  return <div data-testid="search">{search}</div>;
}

function renderControls(initialEntries = ["/concepts"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/concepts"
          element={
            <>
              <MapControls />
              <CurrentSearch />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("MapControls", () => {
  it("renders four filter buttons and the mini-map toggle", () => {
    renderControls();
    for (const label of ["All", "Missed", "Completed", "Open"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
    expect(screen.getByRole("switch", { name: /mini-map/i })).toBeInTheDocument();
  });

  it("clicking Missed sets ?filter=missed", () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: /^Missed$/i }));
    expect(screen.getByTestId("search").textContent).toContain("filter=missed");
  });

  it("clicking All removes the filter parameter", () => {
    renderControls(["/concepts?filter=missed"]);
    expect(screen.getByTestId("search").textContent).toContain("filter=missed");
    fireEvent.click(screen.getByRole("button", { name: /^All$/i }));
    expect(screen.getByTestId("search").textContent).toBe("");
  });

  it("toggling the mini-map switch persists to localStorage", () => {
    renderControls();
    expect(window.localStorage.getItem("learn-llm.conceptmap.minimap")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: /mini-map/i }));
    expect(window.localStorage.getItem("learn-llm.conceptmap.minimap")).toBe("false");
  });
});
