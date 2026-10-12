import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

describe("coordinación de formularios", () => {
  it("usa el blocker público y nunca APIs UNSAFE del router", () => {
    const root = path.resolve(import.meta.dirname, "..");
    expect(sources(root).filter((file) => /\bUNSAFE_\w+/.test(readFileSync(file, "utf8"))).map((file) => path.relative(root, file))).toEqual([]);
  });
});
