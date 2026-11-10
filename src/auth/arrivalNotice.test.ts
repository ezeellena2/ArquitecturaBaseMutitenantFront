import { afterEach, expect, it, vi } from "vitest";
import { rememberArrivalNotice, takeArrivalNotice } from "./arrivalNotice";

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });

it("el aviso cruza una carga de página entera y se entrega una sola vez", () => {
  rememberArrivalNotice("auth:deletion.cancelled");
  expect(takeArrivalNotice()).toBe("auth:deletion.cancelled");
  expect(takeArrivalNotice()).toBeNull();
});

it("descarta lo guardado que no es un aviso conocido", () => {
  sessionStorage.setItem("arquitecturabasemt.arrivalNotice", "auth:otro");
  expect(takeArrivalNotice()).toBeNull();
  expect(sessionStorage.length).toBe(0);
});

it("sin almacenamiento en la pestaña no rompe el ingreso", () => {
  const blocked = () => { throw new Error("bloqueado"); };
  vi.stubGlobal("sessionStorage", { setItem: blocked, getItem: blocked, removeItem: blocked });
  expect(() => rememberArrivalNotice("auth:deletion.cancelled")).not.toThrow();
  expect(takeArrivalNotice()).toBeNull();
});
