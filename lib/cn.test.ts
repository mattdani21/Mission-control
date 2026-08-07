import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins class names into a single string", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts with the last class winning", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps unrelated classes when merging conflicting ones", () => {
    expect(cn("px-2", "text-sm", "px-4")).toBe("text-sm px-4");
  });

  it("accepts conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });
});
