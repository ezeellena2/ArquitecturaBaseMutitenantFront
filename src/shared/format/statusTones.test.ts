import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defineStatusTones, statusTones } from "./statusTones";

const srcRoot = path.resolve(import.meta.dirname, "../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe("statusTones", () => {
  it("declara solo los cinco tonos del tema", () => {
    expect(statusTones.available).toEqual(["success", "warning", "danger", "neutral", "pending"]);
  });

  // Cada feature registra los tonos de un enum de estado del contrato: el nombre del enum, del que sale su texto
  // (`enums.<Enum>.<Valor>`), y un tono por cada valor, con el color del lienzo.
  it("registra los tonos de un enum del contrato con su nombre", () => {
    const tones = defineStatusTones("CompanyStatus", { Active: "success", Inactive: "neutral" });

    expect(tones).toEqual({ enum: "CompanyStatus", tones: { Active: "success", Inactive: "neutral" } });
  });

  // Plan de consolidación, bloque 6: Usuarios, Empresas y Miembros pintan sus estados con StatusBadge y los tonos que
  // registra su feature; ninguna pantalla escribe un color de estado (los `--punto-*` viven en StatusDot) ni elige un tono
  // suelto con StatusDot. En 6d, también el estado de la Página pública y el de cada dominio de Configuración, y el de la
  // Página pública en su tarjeta del Inicio (HomeCards); los pendientes de «Para resolver» pintan su urgencia, no un estado.
  it("Usuarios, Empresas, la Página pública, Configuración y las tarjetas del Inicio no escriben un color de estado ni un tono suelto", () => {
    const loose = ["areas/business/users", "areas/business/companies", "areas/business/public-page", "areas/business/settings"]
      .flatMap((folder) => sourceFiles(path.join(srcRoot, folder)))
      .concat(path.join(srcRoot, "areas/business/home/components/HomeCards.tsx"))
      .filter((file) => /--punto-(?:ok|alerta|apagado)|<StatusDot\b/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(srcRoot, file).replaceAll("\\", "/"));

    expect(loose).toEqual([]);
  });
});
