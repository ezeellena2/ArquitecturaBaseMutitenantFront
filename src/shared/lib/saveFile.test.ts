import { describe, expect, it, vi } from "vitest";
import { contentDispositionFileName, saveResponseAs } from "./saveFile";

describe("contentDispositionFileName", () => {
  it("prioriza filename*=UTF-8'' sobre filename= cuando hay «%» o acentos", () => {
    expect(contentDispositionFileName(
      'attachment; filename="Descuentos 10%.xlsx"; filename*=UTF-8\'\'Descuentos%2010%25.xlsx',
      "respaldo.xlsx",
    )).toBe("Descuentos 10%.xlsx");
    expect(contentDispositionFileName(
      "attachment; filename=Categor_as.xlsx; filename*=UTF-8''Categor%C3%ADas.xlsx",
      "respaldo.xlsx",
    )).toBe("Categorías.xlsx");
  });

  it("acepta filename= plano con «%» literal sin lanzar URIError", () => {
    expect(contentDispositionFileName('attachment; filename="Descuentos 10%.xlsx"', "respaldo.xlsx")).toBe("Descuentos 10%.xlsx");
    expect(contentDispositionFileName("attachment; filename=proveedores-plantilla.xlsx", "respaldo.xlsx")).toBe("proveedores-plantilla.xlsx");
  });

  it("limpia barras o caracteres de control y cae al respaldo si falta el nombre", () => {
    expect(contentDispositionFileName("attachment; filename*=UTF-8''%E0%A4%A; filename=\"carpeta/archivo.xlsx\"", "respaldo.xlsx")).toBe("carpeta_archivo.xlsx");
    expect(contentDispositionFileName(null, "respaldo.xlsx")).toBe("respaldo.xlsx");
    expect(contentDispositionFileName("attachment", "respaldo.xlsx")).toBe("respaldo.xlsx");
  });
});

describe("saveResponseAs", () => {
  it("descarga la respuesta usando el nombre decodificado de Content-Disposition", async () => {
    const downloads: string[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    try {
      const response = new Response(new Blob(["xlsx"]), {
        headers: { "Content-Disposition": "attachment; filename=Categor_as.xlsx; filename*=UTF-8''Categor%C3%ADas.xlsx" },
      });
      await saveResponseAs(response, "respaldo.xlsx");
      expect(downloads).toEqual(["Categorías.xlsx"]);
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
