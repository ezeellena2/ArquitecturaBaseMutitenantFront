import { afterEach, describe, expect, it, vi } from "vitest";
import { safeStorageGet, safeStorageSet } from "./safeStorage";

describe("almacenamiento local opcional", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("lee y guarda una preferencia disponible", () => {
    safeStorageSet("arquitecturabasemt.test", "en-US");
    expect(safeStorageGet("arquitecturabasemt.test")).toBe("en-US");
  });

  it("devuelve ausencia y no interrumpe el cambio cuando el navegador bloquea acceso", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    expect(safeStorageGet("arquitecturabasemt.test")).toBeNull();
    expect(() => safeStorageSet("arquitecturabasemt.test", "en-US")).not.toThrow();
  });

  // F6: el idioma elegido con el almacenamiento bloqueado vale para toda la sesión, sin depender de i18n.
  it("con el navegador bloqueado, lo elegido sigue en memoria durante la sesión", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    safeStorageSet("arquitecturabasemt.blocked", "en-US");
    expect(safeStorageGet("arquitecturabasemt.blocked")).toBe("en-US");

    // Cuando el navegador vuelve a guardar, manda lo guardado: la memoria no pisa nada.
    getItem.mockRestore();
    setItem.mockRestore();
    expect(safeStorageGet("arquitecturabasemt.blocked")).toBeNull();
  });
});
