import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("renders the Mission Control heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /mission control/i })).toBeInTheDocument();
  });

  it("links to the project runbook", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /view the runbook/i })).toHaveAttribute(
      "href",
      "https://github.com/mattdani21/Mission-control",
    );
  });
});
