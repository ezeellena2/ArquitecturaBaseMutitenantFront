import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCaseAreas } from "./e2e-completo-areas.mjs";

test("unifica aliases español/inglés, mayúsculas y espacios con el mismo nombre canónico", () => {
  const groups = [
    ["Plataforma", ["Plataforma", "plataforma", "platform", " PLATFORM ", "Complemento de Plataforma", "Configuración de Plataforma"]],
    ["Asistente", ["Asistente", "asistente", "assistant", "Asistente · complemento", "Asistente: comprobaciones originales sin callback"]],
    ["WhatsApp", ["whatsapp", "WHATSAPP", "WhatsApp de atención", "WhatsApp de Plataforma", "WhatsApp · complemento E11", "WhatsApp · cuota diaria real", "WhatsApp e identidad"]],
    ["Identidad", ["identity", "entra", "Complemento de identidad", "Sesión histórica", "Políticas de registro", "Recuperación"]],
    ["Personal", ["personal", "persona", "personal/account", "Mi cuenta"]],
    ["Organizaciones", ["business", "business/onboarding", "business/members-and-roles", "business/administration", "equipo", "empresa", "administra", "Administración complementaria", "Administración y aislamiento", "Organizaciones · complemento", "Empresas", "Roles", "Roles y permisos de empresa", "Configuración", "Auditoría de organización", "Inicio", "Dominio y métodos administrados"]],
    ["Sitio público", ["public", "llega", "Sitio público", "Sitio público y Configuración"]],
    ["Legales", ["legal", "Legales"]], ["Contrato HTTP", ["Contrato HTTP"]],
    ["Comunicaciones del sistema", ["system-delivery", "manda"]], ["Seguridad", ["security", "Complemento de seguridad"]],
    ["Transversal", ["Asistente y WhatsApp", "Identidad y sitio público", "Público y Personal", "Cierre de cobertura local", "Continuación del recorrido existente", "Fase original del recorrido"]],
  ];
  for (const [canonical, aliases] of groups) for (const area of aliases) {
    const [actual] = normalizeCaseAreas([{ id: "caso", area }]); assert.equal(actual.area, canonical); assert.equal(actual.areaOriginal, area);
  }
});

test("preserva áreas desconocidas sin clasificarlas por coincidencias parciales", () => {
  for (const area of ["  Área nueva <propia>  ", "platform tools", "assistant externo", "", undefined]) {
    const original = Object.freeze({ id: "desconocido", area }); const [actual] = normalizeCaseAreas([original]);
    assert.equal(actual, original); assert.equal(actual.area, area);
  }
  assert.deepEqual(normalizeCaseAreas(), []);
});

test("normaliza sin mutar ni reordenar IDs, pruebas, estados, textos, capítulos o intentos", () => {
  const results = Object.freeze([Object.freeze({ width: 390, status: "failed", actual: "Fallo real", previousAttempts: Object.freeze([{ status: "blocked" }]) })]);
  const proofIds = Object.freeze(["prueba-2", "prueba-1"]); const proofGroups = Object.freeze([proofIds]);
  const original = Object.freeze({ id: "SCREEN-uno", area: "plataforma", title: "Ficha de organización", chapter: "plataforma", chapterTitle: "Opera desde Plataforma", actor: "Operadora", route: "/plataforma/organizaciones/:id", expected: "Expectativa exacta", proofIds, proofGroups, results });
  const input = Object.freeze([original, Object.freeze({ id: "segundo", area: "identity" })]); const before = structuredClone(input);
  const actual = normalizeCaseAreas(input); assert.deepEqual(input, before); assert.deepEqual(actual.map((item) => item.id), ["SCREEN-uno", "segundo"]);
  for (const key of Object.keys(original).filter((key) => key !== "area")) assert.equal(actual[0][key], original[key], key);
  assert.equal(actual[0].area, "Plataforma"); assert.equal(actual[0].areaOriginal, "plataforma");
  const second = normalizeCaseAreas(actual); assert.deepEqual(second, actual); assert.equal(second[0], actual[0]); assert.equal(second[1], actual[1]);
});

test("el módulo conserva el mismo área principal y sus accesos y variantes separados", () => {
  const rows = [{ id: "empresa", area: "assistant", actor: "Dueña", route: "/org/asistente", title: "Asistente de organización" },
    { id: "operador", area: "Asistente", actor: "Operador", route: "/plataforma/asistente", title: "Asistente de Plataforma" },
    { id: "whatsapp", area: "WhatsApp de Plataforma", actor: "Operador", route: "/plataforma/whatsapp" }];
  const actual = normalizeCaseAreas(rows); assert.deepEqual(actual.map((item) => item.area), ["Asistente", "Asistente", "WhatsApp"]);
  for (let index = 0; index < rows.length; index++) for (const key of ["id", "actor", "route", "title"]) assert.equal(actual[index][key], rows[index][key]);
});
