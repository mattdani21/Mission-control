import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("renders the Mission Control heading", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain("<h1");
    expect(html).toContain("Mission Control");
  });

  it("links to the project runbook", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('href="https://github.com/mattdani21/Mission-control"');
    expect(html).toContain("View the runbook");
  });
});
