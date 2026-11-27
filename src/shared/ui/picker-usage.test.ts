import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "../..");

// 262: todo lo que se elige de una lista (una o varias, de dos a cuatro fijas, el Sí o No, los filtros y la carga) va en
// `Picker`. Afuera de shared/ui no se elige con `SearchSelect`, `MultiSelect`, el `Select` de `select.tsx`, `RadioGroupField`,
// un segmentado, los ítems de radio o de casilla de un menú, un `<select>` ni un `<input type="radio">`. Una casilla queda
// para un sí o no suelto (`CheckboxField`). El segmentado queda solo para dos vistas de lo mismo, cada una con su porqué.
const twoViews = new Map([
  ["modules/assistant/usage/AssistantUsagePage.tsx", "«Por día | Por persona»: dos vistas del mismo uso"],
  ["modules/whatsapp/bot/components/BotScreen.tsx", "«Configuración | Recorrido»: dos vistas del mismo bot"],
  ["modules/whatsapp/chats/components/ChatsWorkspace.tsx", "«Clientes | Internos»: dos vistas de la bandeja (tablero Criterio-Elegir)"],
  ["modules/forms/components/catalog/CatalogPreviewPhone.tsx", "«Una opción | Varias»: dos vistas de la misma vista previa de un catálogo (FRM-Catalogo)"],
]);

// Las vistas previas que imitan WhatsApp: sus radios dibujan cómo se ve la lista en el teléfono de quien la recibe, no eligen
// nada de la pantalla, y cada una lleva su porqué (pantallas-y-ui).
const previews = new Map([
  ["modules/forms/components/catalog/CatalogPreviewPhone.tsx", "la lista de un catálogo como la dibuja WhatsApp, con «Una opción» (FRM-Catalogo)"],
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "test" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const comments = /\/\*[\s\S]*?\*\/|(?<![:"'`\\])\/\/.*$/gm;

function violations(relative: string, rawSource: string): string[] {
  const normalized = relative.replaceAll("\\", "/");
  if (normalized.startsWith("shared/ui/")) return [];
  const source = rawSource.replace(comments, "");
  const found: string[] = [];
  for (const match of source.matchAll(/from\s*["']@\/shared\/ui\/(SearchSelect|MultiSelect|select|RadioGroupField|SegmentedControl)["']/g)) {
    if (match[1] === "SegmentedControl" && twoViews.has(normalized)) continue;
    found.push(`${match[1]}: va \`Picker\``);
  }
  if (/\bDropdownMenu(?:RadioGroup|RadioItem|CheckboxItem)\b/.test(source)) found.push("un menú con radios o casillas para elegir: va `Picker`");
  if (/<select\b/.test(source)) found.push("<select> a mano: va `Picker`");
  if (!previews.has(normalized) && /<input\b[^>]*\btype=["']radio["']/.test(source)) found.push("<input type=\"radio\">: va `Picker`");
  return found;
}

describe("una sola pieza para elegir (262)", () => {
  it("detecta las piezas viejas afuera de shared/ui", () => {
    expect(violations("areas/business/users/Invite.tsx", 'import { SearchSelect } from "@/shared/ui/SearchSelect";')).not.toEqual([]);
    expect(violations("areas/business/users/Invite.tsx", 'import { MultiSelect } from "@/shared/ui/MultiSelect";')).not.toEqual([]);
    expect(violations("areas/platform/x/Page.tsx", 'import { Select, SelectTrigger } from "@/shared/ui/select";')).not.toEqual([]);
    expect(violations("modules/whatsapp/x/Dialog.tsx", 'import { RadioGroupField } from "@/shared/ui/RadioGroupField";')).not.toEqual([]);
    expect(violations("modules/whatsapp/x/Page.tsx", 'import { SegmentedControl } from "@/shared/ui/SegmentedControl";')).not.toEqual([]);
    expect(violations("modules/whatsapp/bot/components/BotScreen.tsx", 'import { SegmentedControl } from "@/shared/ui/SegmentedControl";')).toEqual([]);
    expect(violations("modules/whatsapp/x/Menu.tsx", "<DropdownMenuRadioGroup value={x}>")).not.toEqual([]);
    expect(violations("modules/whatsapp/x/Pick.tsx", "<select value={value}>")).not.toEqual([]);
    expect(violations("areas/public/x/Pick.tsx", '<input type="radio" name="a" />')).not.toEqual([]);
    expect(violations("shared/ui/FilterBar.tsx", '<input type="radio" name="a" />')).toEqual([]);
    expect(violations("modules/forms/components/catalog/CatalogPreviewPhone.tsx", '<input type="radio" name="a" />')).toEqual([]);
    expect(violations("modules/forms/components/catalog/OptionsSection.tsx", '<input type="radio" name="a" />')).not.toEqual([]);
    expect(violations("areas/business/x/Page.tsx", 'import { Picker } from "@/shared/ui/Picker"; // antes, SearchSelect de "@/shared/ui/SearchSelect"')).toEqual([]);
  });

  it("nadie elige de una lista con otra pieza", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file).replaceAll("\\", "/");
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative}: ${error}`);
    });
    expect(problems).toEqual([]);
  });
});
