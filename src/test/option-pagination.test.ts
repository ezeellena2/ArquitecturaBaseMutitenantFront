import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function violations(source: string): number {
  const file = ts.createSourceFile("options.ts", source, ts.ScriptTarget.Latest, true);
  let count = 0;
  function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node) && /pageSize\s*=\s*100\b/i.test(node.text)) count++;
    if (ts.isPropertyAssignment(node) && node.name.getText(file).replace(/["']/g, "") === "pageSize"
      && ts.isNumericLiteral(node.initializer) && Number(node.initializer.text) === 100) count++;
    ts.forEachChild(node, visit);
  }
  visit(file);
  return count;
}

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : /[/\\]api[/\\].*\.ts$/.test(target) && !target.endsWith(".test.ts") ? [target] : [];
  });
}

describe("opciones paginadas", () => {
  it("no corta las opciones en una primera página de 100 en las APIs de áreas", () => {
    for (const file of files(path.resolve(import.meta.dirname, "../areas"))) {
      expect(violations(readFileSync(file, "utf8")), file).toBe(0);
    }
  });

  it("detecta tanto el literal de URL como la configuración numérica", () => {
    expect(violations('const url = "?pageSize=100"; const query = { pageSize: 100 };')).toBe(2);
    expect(violations('const query = { pageSize: 10 };')).toBe(0);
  });
});
