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
]);

// Lo que todavía no pasó a la pieza (F11 de la segunda parte de la base, a medias): cada archivo sale de la lista cuando
// se migra, y el test falla si uno de la lista ya no usa la pieza vieja.
const pending = new Set([
  "areas/business/companies/components/AddMemberDialog.tsx",
  "areas/business/companies/components/MemberRolesDialog.tsx",
  "areas/business/roles/components/RoleScopeField.tsx",
  "areas/business/users/components/InviteUserDialog.tsx",
  "areas/business/users/components/RolesField.tsx",
  "areas/business/users/components/UserCompanyDialog.tsx",
  "areas/business/users/pages/UserDetailPage.tsx",
  "areas/platform/legal/pages/PublishLegalVersionPage.tsx",
  "areas/platform/settings/components/RateLimitsSection.tsx",
  "areas/platform/settings/pages/PlatformSettingsPage.tsx",
  "areas/public/auth/components/AuthDestinationField.tsx",
  "areas/public/errors/pages/OtherAccessPage.tsx",
  "modules/assistant/settings/AssistantSettingsEditor.tsx",
  "modules/assistant/settings/ModelSelect.tsx",
  "modules/whatsapp/bot/components/EmployeesTeamDialog.tsx",
  "modules/whatsapp/bot/components/NumberPicker.tsx",
  "modules/whatsapp/bot/components/OptionDialog.tsx",
  "modules/whatsapp/broadcasts/pages/NewBroadcastPage.tsx",
  "modules/whatsapp/chats/components/TemplateDialog.tsx",
  "modules/whatsapp/contacts/components/EditContactDialog.tsx",
  "modules/whatsapp/contacts/components/ImportContactsDialog.tsx",
  "modules/whatsapp/phones/pages/LoadPhonesPage.tsx",
  "modules/whatsapp/teams/components/TeamDialog.tsx",
  "modules/whatsapp/templates/components/TemplateDialog.tsx",
  "modules/whatsapp/templates/pages/TemplatesPage.tsx",
  "shared/account/AddLoginMethodDialog.tsx",
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
  if (/<input\b[^>]*\btype=["']radio["']/.test(source)) found.push("<input type=\"radio\">: va `Picker`");
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
    expect(violations("areas/business/x/Page.tsx", 'import { Picker } from "@/shared/ui/Picker"; // antes, SearchSelect de "@/shared/ui/SearchSelect"')).toEqual([]);
  });

  it("nadie elige de una lista con otra pieza", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file).replaceAll("\\", "/");
      if (pending.has(relative)) return [];
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative}: ${error}`);
    });
    expect(problems).toEqual([]);
  });

  it("la lista de lo que falta migrar solo tiene archivos que todavía usan una pieza vieja", () => {
    const done = [...pending].filter((relative) => {
      const file = path.join(srcRoot, relative);
      try {
        return violations(relative, readFileSync(file, "utf8")).length === 0;
      } catch {
        return true;
      }
    });
    expect(done).toEqual([]);
  });
});
