import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accionesDefinitions, accionesManualChecks, accionesNames, accionesRoles, actionMarker, actionMessage, memberAsProposed, notProposedReply,
  proposalIdOf, proposedReply, runAccionesJourney,
} from "./recorrido-usuario-acciones.mjs";

const base = new URL("https://localtest.me:5174/");

test("las acciones del asistente tienen sus nueve pasos en orden, uno por caso de la I3, y nada para probar a mano", () => {
  assert.deepEqual(accionesDefinitions.map((step) => step.id), Array.from({ length: 9 }, (_, index) => `ACC-${String(index + 1).padStart(2, "0")}`));
  for (const step of accionesDefinitions) assert.ok(step.title.startsWith("Acciones · ") && step.expected.length > 40, step.id);
  const expected = accionesDefinitions.map((step) => step.expected).join(" ");
  // La I3: un rol que no se puede dar, sumar y quitar con «Lo que cambia», quitar, crear un rol de empresa, cambiar permisos,
  // la baja frenada, la reemplazada, la sin permiso y el teléfono.
  for (const text of ["no se resuelve", "Lo que cambia", "Quitar", "vale en una empresa", "el permiso que se suma", "Lo tiene 1 usuario", "Reemplazada",
    "Ya no disponible", "En el teléfono", "Ya se guardó."]) assert.ok(expected.includes(text), text);
  assert.deepEqual(accionesManualChecks, []);
});

test("el mensaje del escenario lleva el marcador del modelo falso y la propuesta como la escribe el modelo", () => {
  const message = actionMessage("users.remove@1", [], "Martín Paz");
  assert.ok(message.startsWith(`${actionMarker} `));
  assert.deepEqual(JSON.parse(message.slice(actionMarker.length + 1)), { action: "users.remove@1", target: "Martín Paz", values: [] });
  const invite = JSON.parse(actionMessage("users.invite@1", [{ field: "roles", value: [{ op: "add", value: "Ventas" }] }]).slice(actionMarker.length + 1));
  assert.deepEqual(Object.keys(invite), ["action", "values"]);
  assert.throws(() => actionMessage("users.invite", []), /versión/u);
  assert.throws(() => actionMessage("users.invite@1", [{ value: "x" }]), /campo/u);
  assert.throws(() => actionMessage("users.remove@1", [], " "), /destino/u);
  assert.notEqual(proposedReply, notProposedReply);
});

test("los nombres son de cada ancho y corrida, los correos son de prueba y «Ventas» tiene su parecido", () => {
  const desktop = accionesNames(1440, "ab12");
  const phone = accionesNames(390, "ab12");
  for (const key of Object.keys(desktop).filter((key) => key !== "similar")) assert.notEqual(desktop[key], phone[key], key);
  for (const key of ["member", "invitee", "other", "replaced"]) assert.match(desktop[key], /^e2e-acc-[a-z]+-1440-ab12@example\.test$/u, key);
  // La duda del paso 02: «Ventas» está en los dos nombres, y ninguno de los dos contiene al otro entero.
  assert.ok(desktop.sales.startsWith(`${desktop.similar} `) && desktop.wholesale.startsWith(`${desktop.similar} `));
  assert.ok(!desktop.wholesale.includes(desktop.sales) && !desktop.sales.includes(desktop.wholesale));
  // En el E2E los dos anchos comparten organización: con otra palabra, la duda de uno no toca los roles del otro.
  const other = accionesNames(390, "ab12", "Cobranzas");
  assert.ok(![other.sales, other.wholesale].some((name) => name.includes(desktop.similar)));
  assert.throws(() => accionesNames(1440, "ab12", "dos palabras"));
  assert.throws(() => accionesNames(800, "ab12"));
  assert.throws(() => accionesNames(1440, "con espacio"));
});

test("la persona puede invitar y usar el asistente, pero no tiene lo de los roles que no puede dar", () => {
  const names = accionesNames(1440, "ab12");
  const roles = new Map(accionesRoles(names));
  assert.deepEqual(roles.get(names.inviter), ["users.invite", "roles.read"]);
  assert.deepEqual(roles.get(names.assistant), ["assistant.use"]);
  const held = new Set([names.assistant, names.inviter, names.hr, names.depot].flatMap((name) => roles.get(name)));
  for (const name of [names.audit, names.wholesale]) assert.ok(roles.get(name).every((code) => !held.has(code)), name);
  assert.equal(new Set(accionesRoles(names).map(([name]) => name)).size, 7);
});

// Usuarios pone el correo como `displayName` de quien no cargó su nombre (OrganizationUserService): la tarjeta la nombra por su
// correo y no suma «Correo», que repetiría lo mismo (B6); con nombre, el correo la distingue de otra que se llame igual.
test("la propuesta nombra a la persona por su nombre con su correo aparte, y sin nombre solo por su correo", () => {
  const email = "persona@ejemplo.com";
  assert.deepEqual(memberAsProposed({ email, displayName: email }), { label: email, detail: [] });
  assert.deepEqual(memberAsProposed({ email, displayName: "" }), { label: email, detail: [] });
  assert.deepEqual(memberAsProposed({ email, displayName: "Ana Pérez" }), { label: "Ana Pérez", detail: [["Correo", email]] });
});

test("la tarjeta abre su pantalla con el id de la propuesta y nada más", () => {
  const id = "0f1e2d3c-4b5a-4968-8776-5a4b3c2d1e0f";
  assert.equal(proposalIdOf(`/org/usuarios/m-1?proposal=${id}`, base), id);
  assert.equal(proposalIdOf(`/org?tab=1&proposal=${id}`, base), id);
  assert.throws(() => proposalIdOf("/org/usuarios/m-1", base));
  assert.throws(() => proposalIdOf("/org?proposal=no-es-un-id", base));
});

test("el recorrido corre los nueve pasos en orden y captura en el navegador de la persona los suyos, si ya entró", async () => {
  const page = { url: () => "https://localtest.me:5174/org", name: "organización" };
  const recorded = [];
  const record = async (id, width, getPage, action) => { recorded.push([id, getPage().name, typeof action, width]); };
  await runAccionesJourney({ page, platformPage: page, width: 390, env: { command: async () => ({}), files: async () => [], messages: async () => [] },
    base, record, signOut: async () => {}, login: async () => {}, owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 390" });
  assert.deepEqual(recorded.map(([id]) => id), accionesDefinitions.map((step) => step.id));
  // Sin correr los pasos la persona no entró: todo se captura en la pestaña de la Dueña.
  for (const [id, target, action, width] of recorded) assert.deepEqual([target, action, width], ["organización", "function", 390], id);
});

test("sin las órdenes del entorno o sin las sesiones del recorrido, las acciones no abren pantallas ni se declaran aprobadas", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  const env = { command: async () => ({}), files: async () => [], messages: async () => [] };
  const journey = { page, platformPage: page, width: 1440, env, base, record, signOut: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 1440" };
  await assert.rejects(runAccionesJourney({ ...journey, env: { command: env.command, files: env.files } }), /órdenes y el correo aislados/u);
  await assert.rejects(runAccionesJourney({ ...journey, owner: undefined }), /la Dueña/u);
  await assert.rejects(runAccionesJourney({ ...journey, login: undefined }), /sesiones/u);
  assert.deepEqual(touched, []);
});
