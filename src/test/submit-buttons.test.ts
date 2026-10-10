import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "..");

// «Criterio · Botones» (formularios.md): un botón de envío no se apaga porque falte un dato o porque un dato esté mal; al
// tocarlo, el campo dice qué corregir. Al editar, «Guardar cambios» se apaga sin cambios; al crear («Crear …»,
// «Agregar …», «Invitar …», «Sumar …»), nunca. Lo que está guardando lo apaga `pending`, no `disabled`. Fuera de eso, se
// apaga solo mientras espera algo que no depende de lo escrito. Cada forma permitida, con su motivo:
const allowed: ReadonlyArray<readonly [RegExp, string, string?]> = [
  [/^!(?:form\.formState\.)?isDirty$/, "«Guardar cambios» sin cambios"],
  [/^(?:Boolean\(\w+\)|mode === "roles") && !(?:form\.formState\.)?isDirty$/, "al editar, sin cambios; al crear, nunca"],
  [/^blocked$/, "un bloqueo de negocio conocido antes de confirmar, explicado en la franja (ReasonDialog)", "shared/platform/ReasonDialog.tsx"],
  [/^unavailable$/, "disponibilidad externa del asistente, independiente del texto y los adjuntos", "modules/assistant/components/AttachmentComposer.tsx"],
  [/^isPending$/, "la sesión que se está leyendo"],
  [/^!(?:csrf|antiforgery\.data)\?\.requestToken$/, "la protección del envío que se está cargando"],
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return directory === srcRoot && entry.name === "test" ? [] : sourceFiles(full);
    return entry.name.endsWith(".tsx") && !/\.(test|spec)\.tsx$/.test(entry.name) ? [full] : [];
  });
}

/// Sólo el isRunning devuelto por el hook de Retry-After: el nombre local no autoriza una guarda de validación.
/// Los símbolos distinguen aliases, desestructuración y parámetros que sombrean una cuenta regresiva de otra función.
function isRetryCountdown(expression: ts.Expression, checker: ts.TypeChecker): boolean {
  let declaration: ts.VariableDeclaration | undefined;
  if (ts.isPropertyAccessExpression(expression) && expression.name.text === "isRunning" && ts.isIdentifier(expression.expression)) {
    const binding = checker.getSymbolAtLocation(expression.expression)?.valueDeclaration;
    if (binding && ts.isVariableDeclaration(binding) && ts.isIdentifier(binding.name)) declaration = binding;
  } else if (ts.isIdentifier(expression)) {
    const binding = checker.getSymbolAtLocation(expression)?.valueDeclaration;
    if (binding && ts.isBindingElement(binding) && !binding.initializer && !binding.dotDotDotToken
      && (binding.propertyName ?? binding.name).getText() === "isRunning" && ts.isObjectBindingPattern(binding.parent)
      && ts.isVariableDeclaration(binding.parent.parent)) declaration = binding.parent.parent;
  }
  if (!declaration || !(declaration.parent.flags & ts.NodeFlags.Const)) return false;
  const call = declaration.initializer;
  if (!call || !ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.arguments.length !== 0) return false;
  const imported = checker.getSymbolAtLocation(call.expression)?.declarations?.[0];
  if (!imported || !ts.isImportSpecifier(imported) || imported.isTypeOnly
    || (imported.propertyName ?? imported.name).text !== "useRetryAfterCountdown") return false;
  const importClause = imported.parent.parent;
  const importDeclaration = importClause.parent;
  return !importClause.isTypeOnly && ts.isImportDeclaration(importDeclaration)
    && ts.isStringLiteral(importDeclaration.moduleSpecifier)
    && importDeclaration.moduleSpecifier.text === "@/shared/api/useRetryAfterCountdown";
}

/// Los `disabled` de los botones de envío que no son una de las formas permitidas.
function violations(source: string, file?: string): string[] {
  const fileName = "buttons.tsx";
  const parsed = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const options: ts.CompilerOptions = { noLib: true, noResolve: true };
  // Sólo los disabled que necesitan resolver el hook requieren símbolos; el resto usa el mismo AST.
  let checker: ts.TypeChecker | undefined;
  function typeChecker(): ts.TypeChecker {
    return checker ??= ts.createProgram([fileName], options, {
      ...ts.createCompilerHost(options),
      getSourceFile: (name) => name === fileName ? parsed : undefined,
    }).getTypeChecker();
  }
  const problems: string[] = [];
  function visit(node: ts.Node): void {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^(Button|button)$/.test(node.tagName.getText(parsed))) {
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
      const type = attributes.find((attribute) => attribute.name.getText(parsed) === "type")?.initializer;
      const disabled = attributes.find((attribute) => attribute.name.getText(parsed) === "disabled");
      if (type && ts.isStringLiteral(type) && type.text === "submit" && disabled) {
        const expression = disabled.initializer && ts.isJsxExpression(disabled.initializer) ? disabled.initializer.expression : undefined;
        const text = (expression?.getText(parsed) ?? disabled.initializer?.getText(parsed) ?? "true").replace(/\s+/g, " ").trim();
        if (!allowed.some(([pattern, , onlyFor]) => pattern.test(text) && (!onlyFor || file === onlyFor))
          && !(expression && isRetryCountdown(expression, typeChecker()))) problems.push(text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return problems;
}

function retryForm(disabled: string, binding = "const retry = useRetryAfterCountdown();", imported = "useRetryAfterCountdown", module = "@/shared/api/useRetryAfterCountdown"): string {
  return `import { ${imported} } from "${module}";
    function SendForm() {
      ${binding}
      return <Button type="submit" disabled={${disabled}}>Enviar código</Button>;
    }`;
}

describe("botones de envío («Criterio · Botones»)", () => {
  it("detecta el botón de envío que se apaga porque falta algo o porque algo está mal", () => {
    expect(violations('<Button type="submit" disabled={!form.formState.isValid}>Crear empresa</Button>')).toEqual(["!form.formState.isValid"]);
    expect(violations('<Button type="submit" disabled={!name.trim()} pending={save.isPending}>Crear rol</Button>')).toEqual(["!name.trim()"]);
    expect(violations('<Button type="submit" form="x"\n  disabled={!isDirty || !companyId}>Guardar cambios</Button>')).toEqual(["!isDirty || !companyId"]);
    expect(violations('<Button type="submit" disabled>Invitar</Button>')).toEqual(["true"]);
    expect(violations('<button type="submit" disabled={!accepted}>Crear organización</button>')).toEqual(["!accepted"]);
  });

  it("deja apagar «Guardar cambios» sin cambios y lo que espera algo que no depende de lo escrito", () => {
    expect(violations('<Button type="submit" form="x" disabled={!isDirty} pending={save.isPending}>Guardar cambios</Button>')).toEqual([]);
    expect(violations('<Button type="submit" onClick={() => go(a > b)} disabled={Boolean(role) && !isDirty}>Guardar</Button>')).toEqual([]);
    expect(violations(retryForm("retry.isRunning"))).toEqual([]);
    expect(violations('<Button type="submit" pending={add.isPending}>Siguiente</Button>')).toEqual([]);
    expect(violations('<Button type="button" disabled={!ready}>Cancelar</Button>')).toEqual([]);
  });

  it.each(["sendRetry", "verifyRetry", "waitBeforeSending"])("admite la espera del 429 aunque el resultado del hook se llame %s", (name) => {
    expect(violations(retryForm(`${name}.isRunning`, `const ${name} = useRetryAfterCountdown();`))).toEqual([]);
  });

  it.each(["isRunning", "sendWaiting"])("admite la espera del 429 desestructurada como %s", (name) => {
    expect(violations(retryForm(name, `const { isRunning: ${name} } = useRetryAfterCountdown();`))).toEqual([]);
  });

  it("admite un alias del import del hook compartido", () => {
    expect(violations(retryForm("sendRetry.isRunning", "const sendRetry = useSendRetry();", "useRetryAfterCountdown as useSendRetry"))).toEqual([]);
  });

  it.each([
    "sendRetry.isRunning || !email",
    "sendRetry.isRunning || !form.formState.isValid",
    "sendRetry.isRunning && !accepted",
    "!sendRetry.isRunning",
    "form.formState.isValid ? false : sendRetry.isRunning",
    "sendRetry.isRunning ? false : !email",
  ])("rechaza una guarda de validación o una inversión añadida a la espera: %s", (disabled) => {
    expect(violations(retryForm(disabled, "const sendRetry = useRetryAfterCountdown();"))).toEqual([disabled]);
  });

  it.each([
    ['const retry = { isRunning: !email };', "useRetryAfterCountdown", "@/shared/api/useRetryAfterCountdown"],
    ["const retry = useValidation();", "useValidation", "@/shared/hooks/useValidation"],
    ["const retry = useRetryAfterCountdown();", "useRetryAfterCountdown", "@/areas/example/useRetryAfterCountdown"],
  ])("rechaza un isRunning llamado retry que no procede de la espera compartida: %s", (binding, imported, module) => {
    expect(violations(retryForm("retry.isRunning", binding, imported, module))).toEqual(["retry.isRunning"]);
  });

  it("no confunde la espera de otra función con un parámetro local de validación", () => {
    const source = `${retryForm("retry.isRunning")}
      function ValidationForm(retry: { isRunning: boolean }) {
        return <Button type="submit" disabled={retry.isRunning}>Crear</Button>;
      }`;
    expect(violations(source)).toEqual(["retry.isRunning"]);
  });

  it("admite un bloqueo explicado antes de confirmar (E5)", () => {
    expect(violations('<Button type="submit" disabled={blocked}>Dar de baja</Button>', "shared/platform/ReasonDialog.tsx")).toEqual([]);
    expect(violations('<Button type="submit" disabled={blocked}>Crear rol</Button>', "areas/business/roles/RoleEditorPage.tsx")).toEqual(["blocked"]);
    expect(violations('<Button type="submit" disabled={blocked || !reason}>Dar de baja</Button>')).toEqual(["blocked || !reason"]);
  });

  it("admite sólo la disponibilidad externa del compositor en su ruta exacta", () => {
    const source = '<Button type="submit" disabled={unavailable} pending={pending}>Enviar</Button>';
    expect(violations(source, "modules/assistant/components/AttachmentComposer.tsx")).toEqual([]);
    expect(violations(source)).toEqual(["unavailable"]);
    expect(violations(source, "areas/business/roles/RoleEditorPage.tsx")).toEqual(["unavailable"]);
  });

  it.each(["unavailable || !text", "unavailable || pending", "!isValid", "!text", "!unavailable", "unavailable && !text", "unavailable || !form.formState.isValid"])("rechaza validación o espera añadida a disponibilidad: %s", (disabled) => {
    expect(violations(`<Button type="submit" disabled={${disabled}}>Enviar</Button>`, "modules/assistant/components/AttachmentComposer.tsx")).toEqual([disabled]);
  });

  it("ningún botón de envío del código se apaga porque falta algo o porque algo está mal", () => {
    const files = sourceFiles(srcRoot);
    const problems = files.flatMap((file) => {
      const relative = path.relative(srcRoot, file).replaceAll("\\", "/");
      return violations(readFileSync(file, "utf8"), relative).map((disabled) => `${relative}: disabled={${disabled}}`);
    });
    expect(files.some((file) => file.endsWith("CompanyDialog.tsx"))).toBe(true);
    expect(problems).toEqual([]);
  });
});
