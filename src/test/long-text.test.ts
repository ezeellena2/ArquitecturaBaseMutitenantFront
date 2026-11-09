import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

// 174 (el texto largo, entero): estas filas del teléfono y del Inicio parten el texto en renglones, como sus tableros, y no
// lo cortan con «…» (M-Inicio-Org, M-WA-Editar, M-Cuentas y M-Usuarios en la galería de la base de la 12).
const files = [
  "src/shared/ui/app/ListRow.tsx",
  "src/areas/business/home/components/PhoneHome.tsx",
  "src/areas/business/home/components/HomeCards.tsx",
  "src/modules/whatsapp/bot/components/PhoneTapRow.tsx",
  "src/modules/whatsapp/bot/components/BotFlow.tsx",
];

describe("el texto largo, entero (174)", () => {
  it.each(files)("%s no corta el texto con «…»", (file) => {
    expect(readFileSync(path.join(root, file), "utf8")).not.toMatch(/\btruncate\b|line-clamp|text-ellipsis/);
  });
});
