import { describe, expect, it } from "vitest";

import { cn, formatDuration, formatNumber } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatNumber", () => {
  it("formats numbers", () => {
    expect(formatNumber(12.345, 1)).toBe("12.3");
    expect(formatNumber(1000, 0)).toBe("1,000");
  });

  it("returns an em dash for missing values", () => {
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(null)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(undefined)).toBe("—");
  });
});
