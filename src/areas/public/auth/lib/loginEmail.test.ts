import { afterEach, expect, it, vi } from "vitest";
import { carriedLoginEmail, carryLoginEmail, emailFromNavigation, forgetLoginEmail } from "./loginEmail";

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });

it("el correo válido cruza un retorno OIDC una sola vez, sin ir a la URL", () => {
  const email = emailFromNavigation({ email: "persona@example.test" });
  carryLoginEmail(email);
  expect(carriedLoginEmail()).toBe(email);
  expect(carriedLoginEmail()).toBe(email);
  forgetLoginEmail();
  expect(carriedLoginEmail()).toBe("");
});

it.each([null, {}, { email: "inválido" }, { email: 12 }])("ignora el estado inválido %j", (state) => {
  expect(emailFromNavigation(state)).toBe("");
});

it("descarta el dato inválido almacenado", () => {
  carryLoginEmail("inválido");
  expect(carriedLoginEmail()).toBe("");
  forgetLoginEmail();
  expect(sessionStorage.length).toBe(0);
});

it("permite ingresar si el almacenamiento de la pestaña está bloqueado", () => {
  vi.stubGlobal("sessionStorage", { setItem: () => { throw new Error(); }, getItem: () => { throw new Error(); } });
  expect(() => carryLoginEmail("persona@example.test")).not.toThrow();
  expect(carriedLoginEmail()).toBe("");
  expect(() => forgetLoginEmail()).not.toThrow();
});
