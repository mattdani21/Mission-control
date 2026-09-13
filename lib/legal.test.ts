import { describe, expect, it } from "vitest";

import { renderLegalMarkdown } from "./legal";

describe("renderLegalMarkdown", () => {
  it("renders headings, lists, bold and code without passing raw HTML", () => {
    const html = renderLegalMarkdown(
      ["# Title", "", "- **Account data** — email", "- `session` cookie", "", "Contact <script>alert(1)</script>."].join(
        "\n",
      ),
    );
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>Account data</strong>");
    expect(html).toContain("<code>session</code>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
