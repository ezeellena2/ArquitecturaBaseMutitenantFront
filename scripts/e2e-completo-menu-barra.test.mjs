import assert from "node:assert/strict";
import test from "node:test";
import { openBarMenu, chooseBarAction } from "./e2e-completo-menu-barra.mjs";

function fixture(width) {
  const calls = [];
  const item = { click: async () => calls.push("seleccionar acción") };
  const menu = { waitFor: async (options) => calls.push(options?.state === "hidden" ? "menú cerrado" : "menú visible"), getByRole: (role, options) => {
    assert.equal(role, "menuitem"); assert.deepEqual(options, { name: "Suspender", exact: true }); return item;
  } };
  const dialog = { waitFor: async (options) => calls.push(options?.state === "hidden" ? "hoja cerrada" : "hoja visible"), getByRole: (role) => { assert.equal(role, "menu"); return menu; } };
  const heading = { filter: () => heading, first: () => heading, innerText: async () => "  Ficha propia  " };
  const desktopMenu = { filter: () => desktopMenu, last: () => menu };
  const page = { viewportSize: () => ({ width }), getByRole: (role, options) => {
    if (role === "heading") { assert.deepEqual(options, { level: 1 }); return heading; }
    if (role === "dialog") { assert.deepEqual(options, { name: "Ficha propia", exact: true }); return dialog; }
    assert.equal(role, "menu"); return desktopMenu;
  } };
  const trigger = { waitFor: async () => {}, getAttribute: async (name) => { assert.equal(name, "aria-haspopup"); return "dialog"; }, click: async () => calls.push("clic"), focus: async () => calls.push("foco"), press: async (key) => { assert.equal(key, "Enter"); calls.push("Enter"); } };
  return { page, trigger, calls, heading };
}

test("la barra debe estar visible antes de leer el título para no conservar Iniciando sesión", async () => {
  const { page, trigger, heading } = fixture(390); let ready = false;
  trigger.waitFor = async (options) => { assert.deepEqual(options, { state: "visible" }); ready = true; };
  heading.innerText = async () => { assert.equal(ready, true, "El título de autenticación todavía es transitorio"); return "Ficha propia"; };
  await chooseBarAction(page, trigger, "Suspender");
});

test("móvil abre por clic o Enter, acota al dialog nombrado y espera su cierre antes de continuar", async () => {
  for (const activation of ["click", "Enter"]) {
    const { page, trigger, calls } = fixture(390);
    await chooseBarAction(page, trigger, "Suspender", { activation });
    assert.deepEqual(calls, [...(activation === "Enter" ? ["foco", "Enter"] : ["clic"]), "hoja visible", "menú visible", "seleccionar acción", "hoja cerrada"]);
  }
});

test("escritorio conserva el desplegable y el contrato móvil viejo no se acepta", async () => {
  const { page, trigger, calls } = fixture(1440); await chooseBarAction(page, trigger, "Suspender");
  assert.deepEqual(calls, ["clic", "menú visible", "seleccionar acción", "menú cerrado"]);
  const phone = fixture(390); phone.trigger.getAttribute = async () => "menu";
  await assert.rejects(openBarMenu(phone.page, phone.trigger), /debe abrir una hoja/u); assert.deepEqual(phone.calls, []);
});
