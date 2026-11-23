import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "../..");

// pantallas-y-ui.md: toda pantalla se arma solo con piezas de `shared/ui`. Una tabla es `DataTable` o `List`, elegir es
// `SearchSelect`, `MultiSelect` o los selectores de `shared/ui/fields`, y lo que se abre encima es `Dialog`, `ConfirmDialog`,
// `Sheet`, `RowActions` o el menú de `dropdown-menu`. Ninguna feature arma su propia ventana con el navegador ni con Radix.
// Cada excepción, con el porqué.
const rawElementAllowed = new Map([
  // Las tablas que escribe el Asistente en Markdown: son texto de la respuesta, sin columnas tipadas para un `DataTable`.
  ["modules/assistant/components/AssistantMarkdown.tsx", "table"],
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    // Las carpetas `test/` (la raíz y las de cada módulo) son fixtures y galerías de pruebas, no pantallas.
    if (entry.isDirectory()) return entry.name === "test" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const comments = /\/\*[\s\S]*?\*\/|(?<![:"'`\\])\/\/.*$/gm;

function violations(relative: string, rawSource: string): string[] {
  const normalized = relative.replaceAll("\\", "/");
  const source = rawSource.replace(comments, "");
  const inSharedUi = normalized.startsWith("shared/ui/");
  const found: string[] = [];

  // Las ventanas del navegador: ni con `window.` ni sueltas. Una función propia que se llama `confirm` no cuenta.
  if (/\b(?:window|globalThis|self)\s*\.\s*(?:alert|confirm|prompt)\b/.test(source)) {
    found.push("ventana del navegador (alert, confirm o prompt): va `ConfirmDialog` o un aviso");
  }
  for (const name of ["alert", "confirm", "prompt"]) {
    const declared = new RegExp(`\\b(?:function|const|let|var)\\s+${name}\\b`).test(source);
    if (!declared && new RegExp(`(?<![\\w$.])${name}\\s*\\(`).test(source)) {
      found.push(`${name}() del navegador: va \`ConfirmDialog\` o un aviso`);
    }
  }
  if (inSharedUi) return found;

  if (/(?:from\s*|import\s*\(?\s*)["'](?:radix-ui|@radix-ui\/[^"']+|vaul|cmdk)["']/.test(source)) {
    found.push("primitiva de interfaz (Radix, vaul o cmdk) fuera de shared/ui: va la pieza de shared/ui");
  }
  if (/\bcreatePortal\s*\(/.test(source)) {
    found.push("createPortal fuera de shared/ui: lo que se abre encima es `Dialog`, `Sheet` o un menú de shared/ui");
  }
  if (!normalized.endsWith(".tsx")) return found;
  for (const match of source.matchAll(/<(table|select|dialog)\b/g)) {
    if (rawElementAllowed.get(normalized) === match[1]) continue;
    found.push(`<${match[1]}> a mano: va ${match[1] === "table" ? "`DataTable` o `List`" : match[1] === "select" ? "`SearchSelect`, `MultiSelect` o un campo de shared/ui/fields" : "`Dialog` o `ConfirmDialog`"}`);
  }
  for (const match of source.matchAll(/\brole=\{?["'](?:alert)?dialog["']/g)) {
    // Solo un elemento del HTML (`<div role="dialog">`): una pieza de shared/ui (`<DialogContent role="alertdialog">`) puede
    // cambiar el rol de su ventana.
    const tag = [...source.slice(0, match.index).matchAll(/<([A-Za-z][\w.-]*)/g)].at(-1)?.[1] ?? "";
    if (/^[a-z]/.test(tag)) found.push(`<${tag} role="dialog"> a mano: va \`Dialog\`, \`Sheet\` o un menú de shared/ui`);
  }
  return found;
}

describe("pantallas armadas solo con piezas de shared/ui", () => {
  it("detecta ventanas del navegador, primitivas y elementos a mano", () => {
    expect(violations("areas/business/roles/pages/RolesPage.tsx", "if (window.confirm(t(\"x\"))) remove();")).not.toEqual([]);
    expect(violations("modules/whatsapp/chats/Chat.tsx", "alert(message);")).not.toEqual([]);
    expect(violations("layouts/AppShell.tsx", "const name = prompt(t(\"name\"));")).not.toEqual([]);
    expect(violations("shared/ui/ConfirmDialog.tsx", "globalThis.confirm(text)")).not.toEqual([]);
    expect(violations("areas/platform/accounts/pages/AccountsPage.tsx", "const confirm = (action) => onConfirm(action); confirm(\"suspend\");")).toEqual([]);
    expect(violations("shared/account/ChangeLoginMethodDialog.tsx", "async function confirm() {} void confirm();")).toEqual([]);
    expect(violations("areas/business/home/Home.tsx", "form.confirm(values); toast.alert(x);")).toEqual([]);
    expect(violations("layouts/notifications/NotificationBell.tsx", 'import { Popover } from "radix-ui";')).not.toEqual([]);
    expect(violations("areas/business/users/Picker.tsx", 'import * as Dialog from "@radix-ui/react-dialog";')).not.toEqual([]);
    expect(violations("modules/whatsapp/chats/Drawer.tsx", 'import { Drawer } from "vaul";')).not.toEqual([]);
    expect(violations("areas/business/users/Search.tsx", 'import { Command } from "cmdk";')).not.toEqual([]);
    expect(violations("shared/ui/FilterBar.tsx", 'import { Popover as PopoverPrimitive } from "radix-ui";')).toEqual([]);
    expect(violations("areas/business/users/Panel.tsx", "return createPortal(<div />, document.body);")).not.toEqual([]);
    expect(violations("areas/business/audit/columns.tsx", "<table className=\"w-full\">")).not.toEqual([]);
    expect(violations("modules/assistant/lib/selectors.ts", "const dialog = '<div role=\"dialog\">';")).toEqual([]);
    expect(violations("modules/whatsapp/bot/Pick.tsx", "<select value={value}>")).not.toEqual([]);
    expect(violations("areas/platform/legal/Confirm.tsx", "<dialog open>")).not.toEqual([]);
    expect(violations("modules/assistant/components/AssistantMarkdown.tsx", "table: ({ children }) => <table>{children}</table>")).toEqual([]);
    expect(violations("areas/business/users/Menu.tsx", '<div className="fixed" role="dialog" aria-modal="true">')).not.toEqual([]);
    expect(violations("areas/business/users/Menu.tsx", "<section role={\"alertdialog\"}>")).not.toEqual([]);
    expect(violations("areas/platform/legal/Page.tsx", '<DialogContent role="alertdialog" size="sm">')).toEqual([]);
    expect(violations("shared/ui/FilterBar.tsx", '<div role="dialog"><table /></div>')).toEqual([]);
    expect(violations("areas/business/users/DataTable.tsx", "<DataTable columns={columns} /> <Select value={x} />")).toEqual([]);
  });

  it("mantiene las reglas en el código de producción", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file);
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative.replaceAll("\\", "/")}: ${error}`);
    });
    expect(problems).toEqual([]);
  });
});
