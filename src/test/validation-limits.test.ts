import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

function violations(source: string): string[] {
  const tree = ts.createSourceFile("form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const numeric = (node: ts.Node): boolean => ts.isNumericLiteral(node)
    || ts.isPrefixUnaryExpression(node) && numeric(node.operand)
    || ts.isParenthesizedExpression(node) && numeric(node.expression);
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(tree) === "maxLength" && node.initializer
      && (ts.isJsxExpression(node.initializer) && node.initializer.expression && numeric(node.initializer.expression)
        || ts.isStringLiteral(node.initializer) && /^\d+$/.test(node.initializer.text))) found.push(node.getText(tree));
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === "max" && node.expression.expression.getText(tree) !== "Math"
      && node.arguments[0] && numeric(node.arguments[0])) found.push(node.getText(tree));
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return found;
}

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : /\.tsx?$/.test(path) && !/generated|\.test\.|[\\/]test[\\/]/.test(path) ? [path] : [];
  });
}

it("los límites de formularios salen del contrato en todas las áreas y módulos", () => {
  const offenders = files("src").flatMap((file) => violations(readFileSync(file, "utf8")).map((found) => `${file}: ${found}`));
  expect(offenders).toEqual([]);
});

it("detecta límites JSX y Zod numéricos, y permite el contrato y Math.max", () => {
  expect(violations('const input = <input maxLength={500} />; z.string().max(1000); z.number().max((2147483647));')).toHaveLength(3);
  expect(violations('const input = <input maxLength={limits.name.maxLength} />; z.string().max(limits.name.maxLength); Math.max(0, count);')).toEqual([]);
});
