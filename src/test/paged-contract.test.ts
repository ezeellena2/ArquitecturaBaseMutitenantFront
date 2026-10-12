import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

const pageProperties = ["items", "page", "pageSize", "totalCount", "totalPages", "hasPrevious", "hasNext"];
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

it("los tipos de páginas vienen del contrato y no repiten una interfaz de respuesta propia", () => {
  const violations: string[] = [];
  for (const file of files("src").filter((path) => /\.(ts|tsx)$/u.test(path) && !/generated|\.test\.|[\\/]test[\\/]/u.test(path))) {
    const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) {
        const properties = node.members.flatMap((member) => member.name ? [member.name.getText(tree)] : []);
        if (pageProperties.every((property) => properties.includes(property))) violations.push(file);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  expect(violations).toEqual([]);
});
