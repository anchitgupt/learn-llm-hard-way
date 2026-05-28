import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplyStep } from "../ReplyStep";

describe("ReplyStep", () => {
  it("echoes the final reply text", () => {
    render(<ReplyStep finalReply="437" />);
    expect(screen.getByText("437")).toBeInTheDocument();
  });

  it("renders an empty state when finalReply is empty", () => {
    render(<ReplyStep finalReply="" />);
    expect(screen.getByText(/No reply yet/i)).toBeInTheDocument();
  });
});
