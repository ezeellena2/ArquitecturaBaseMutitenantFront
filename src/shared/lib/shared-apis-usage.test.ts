import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "../..");

// Excepciones explícitas de URL.createObjectURL fuera de shared/lib/:
// - AttachmentComposer.tsx: vista previa en memoria de una imagen local antes de subirla (no es descarga).
// - privateDownload.ts: pendiente de unificar en shared/lib/saveFile.ts cuando cierre Tanda 2 (KAN-131).
const objectUrlAllowed = new Set([
  "modules/assistant/components/AttachmentComposer.tsx",
  "modules/assistant/lib/privateDownload.ts",
]);

// Excepciones temporales de import directo de "sonner" en modules/forms/ (en edición paralela por Tanda 2;
// retirar cuando cierre Tanda 2 y se complete la migración de KAN-131 en modules/forms/).
const sonnerAllowedPendingTanda2 = new Set([
  "modules/forms/pages/CatalogEditorPage.tsx",
  "modules/forms/hooks/useCatalogFieldsDialog.ts",
  "modules/forms/hooks/useCatalogImport.ts",
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "test" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function violations(relative: string, source: string): string[] {
  const normalized = relative.replaceAll("\\", "/");
  const inSharedLib = normalized.startsWith("shared/lib/");
  const inSharedUi = normalized.startsWith("shared/ui/");
  const found: string[] = [];

  if (!inSharedLib && !objectUrlAllowed.has(normalized) && /\bURL\s*\.\s*createObjectURL\s*\(/.test(source)) {
    found.push("URL.createObjectURL fuera de shared/lib/: usar shared/lib/saveFile");
  }
  if (!inSharedLib && /\bnavigator\s*\.\s*clipboard\s*\.\s*writeText\s*\(/.test(source)) {
    found.push("navigator.clipboard.writeText fuera de shared/lib/: usar copyToClipboard de shared/lib/clipboard");
  }
  if (!inSharedUi && !sonnerAllowedPendingTanda2.has(normalized) && /(?:from\s*|import\s*\(?\s*)["']sonner["']/.test(source)) {
    found.push('import directo de "sonner" fuera de shared/ui/: usar la fachada de shared/ui/sonner');
  }
  return found;
}

describe("uso exclusivo de utilidades compartidas de navegador y avisos", () => {
  it("detecta copias directas de descargas, portapapeles y sonner", () => {
    expect(violations("modules/whatsapp/contacts/lib/saveFile.ts", "const url = URL.createObjectURL(blob);")).not.toEqual([]);
    expect(violations("shared/lib/saveFile.ts", "const url = URL.createObjectURL(blob);")).toEqual([]);
    expect(violations("modules/assistant/components/AttachmentComposer.tsx", "const url = URL.createObjectURL(file);")).toEqual([]);
    expect(violations("areas/business/settings/pages/SettingsPage.tsx", "navigator.clipboard.writeText(value);")).not.toEqual([]);
    expect(violations("shared/lib/clipboard.ts", "navigator.clipboard.writeText(text);")).toEqual([]);
    expect(violations("areas/business/roles/pages/RolesPage.tsx", 'import { toast } from "sonner";')).not.toEqual([]);
    expect(violations("shared/ui/sonner.tsx", 'import { toast } from "sonner";')).toEqual([]);
  });

  it("mantiene las reglas en el código de producción", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file);
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative.replaceAll("\\", "/")}: ${error}`);
    });
    expect(problems).toEqual([]);
  });
});
