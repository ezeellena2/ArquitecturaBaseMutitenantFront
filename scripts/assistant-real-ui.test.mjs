import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { assistantExportPath, acceptAssistantNoticeFromHome, conversationAction, assistantTerminalDiagnostic, assistantAttachmentQuantityCases } from "./assistant-real-ui.mjs";
import { chromium } from "playwright";

function quantityPage({ lastEvent = "done", persisted = 5 } = {}) {
  const root = "/api/organization/assistant";
  const fresh = `${root}/conversations/fresh-quantity`;
  const requests = [];
  let version = 1;
  let uploads = 0;
  let complete = false;
  return { root, requests, page: { evaluate: async (_operation, request) => {
    requests.push(request);
    if (request.route === `${root}/conversations` && request.method === "POST") return { status: 201, body: { id: "fresh-quantity", version } };
    assert.ok(request.route.startsWith(fresh), "La cantidad nunca reutiliza la conversación de transporte.");
    if (request.route === fresh) return { status: 200, body: { conversation: { version }, messages: { items: complete
      ? [{ role: "user", status: "Complete", attachments: Array.from({ length: persisted }, (_, index) => ({ id: `attachment-${index}` })) }]
      : [] } } };
    assert.equal(request.body.conversationVersion, version, "Cada subida y envío relee la versión real.");
    if (request.route === `${fresh}/attachments`) { version++; return { status: 201, body: { id: `attachment-${uploads++}` } }; }
    assert.equal(request.route, `${fresh}/messages`);
    if (request.body.attachmentIds.length === 6) return { status: 400 };
    assert.equal(request.body.attachmentIds.length, 5);
    assert.equal(new Set(request.body.attachmentIds).size, 5);
    complete = true;
    return { status: 200, events: ["start", lastEvent] };
  } } };
}

test("la cantidad de adjuntos se mide en un chat nuevo y conserva seis rechazados y cinco persistidos", async () => {
  const { page, root, requests } = quantityPage();
  await assistantAttachmentQuantityCases(page, root, 1440);
  assert.equal(requests[0].route, `${root}/conversations`);
  assert.equal(requests.filter((request) => request.file).length, 5);
  assert.deepEqual(requests.filter((request) => request.route.endsWith("/messages")).map((request) => request.body.attachmentIds.length), [6, 5]);
});

test("la cantidad conserva el fallo si cinco no terminan en done o no quedan cinco persistidos", async () => {
  for (const options of [{ lastEvent: "error" }, { persisted: 4 }]) {
    const { page, root } = quantityPage(options);
    await assert.rejects(assistantAttachmentQuantityCases(page, root, 390), { code: "ERR_ASSERTION" });
  }
});

test("el diagnóstico terminal sólo entrega lastEvent y código sin cuerpo ni datos privados", () => {
  assert.deepEqual(assistantTerminalDiagnostic({ events: ["start", "error"], terminal: {
    code: "Assistant.Provider.ContextTooLarge", text: "respuesta privada", traceId: "trace privado", token: "secret" }, body: "cuerpo privado" }),
  { lastEvent: "error", terminal: { code: "Assistant.Provider.ContextTooLarge" } });
  assert.deepEqual(assistantTerminalDiagnostic({ events: ["valor privado"], terminal: { code: "texto privado" } }), { lastEvent: "none", terminal: { code: "none" } });
  assert.deepEqual(assistantTerminalDiagnostic({ events: ["done"] }), { lastEvent: "done", terminal: { code: "none" } });
});

test("el foco de acceso espera Inicio y pulsa Entendido explícitamente sólo si aparece el aviso", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const stages = [];
    await page.setContent('<main></main>');
    await page.evaluate(() => {
      setTimeout(() => {
        document.querySelector("main").innerHTML = '<h2 aria-hidden="true">¿Qué querés consultar?</h2><div role="dialog" aria-label="Antes de tu primera consulta"><button>Entendido</button></div>';
        document.querySelector("button").addEventListener("click", () => {
          document.body.dataset.accepted = "explicit";
          document.querySelector('[role="dialog"]').remove();
          document.querySelector("h2").removeAttribute("aria-hidden");
        });
      }, 20);
    });
    await acceptAssistantNoticeFromHome(page, (stage) => stages.push(stage));
    assert.equal(await page.locator("body").getAttribute("data-accepted"), "explicit");
    assert.equal(stages.length, 2);
    await acceptAssistantNoticeFromHome(page, () => { throw new Error("El aviso aceptado no se acepta otra vez."); });
    await page.setContent('<h2>El asistente todavía no está configurado</h2>');
    await acceptAssistantNoticeFromHome(page, () => { throw new Error("Sin configuración no hay aceptación implícita."); });
  } finally { await browser.close(); }
});

test("las acciones de la guardada no confunden otra conversación del mismo título", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<section><h2>Guardadas</h2><button aria-label="Acciones de Consulta de prueba" data-group="saved">⋮</button></section><section><h2>Recientes</h2><button aria-label="Acciones de Consulta de prueba" data-group="recent">⋮</button></section>');
    await page.evaluate(() => {
      for (const button of document.querySelectorAll("button")) button.addEventListener("click", () => {
        document.body.dataset.group = button.dataset.group;
        const action = document.createElement("button"); action.setAttribute("role", "menuitem"); action.setAttribute("aria-label", "Renombrar: Consulta de prueba");
        action.addEventListener("click", () => { document.body.dataset.action = "rename"; });
        document.body.append(action);
      });
    });
    await conversationAction(page, 1440, "Consulta de prueba", "Renombrar", { saved: true });
    assert.equal(await page.locator("body").getAttribute("data-group"), "saved");
    assert.equal(await page.locator("body").getAttribute("data-action"), "rename");
  } finally { await browser.close(); }
});

test("los exportes reales quedan con nombres fijos por ancho y formato en la carpeta indicada", async (t) => {
  const parent = path.resolve(import.meta.dirname, "../.local");
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, "e8b-exportes-focal-"));
  t.after(async () => {
    assert.equal(path.dirname(directory), parent);
    await rm(directory, { recursive: true, force: true });
  });
  const original = path.join(directory, "download-original");
  const content = Buffer.from("información útil\n", "utf8");
  await writeFile(original, content);
  const targetDirectory = path.join(directory, "exportes");
  const saved = [];
  const download = { path: async () => { throw new Error("La copia debe usarse en esta corrida."); },
    saveAs: async (target) => { saved.push(target); await writeFile(target, await readFile(original)); } };
  for (const width of [1440, 390]) for (const format of ["markdown", "pdf"]) {
    const target = await assistantExportPath(download, width, format, targetDirectory);
    assert.equal(path.dirname(target), targetDirectory);
    assert.equal(path.basename(target), `asistente-${width}.${format === "pdf" ? "pdf" : "md"}`);
    assert.deepEqual(await readFile(target), content);
  }
  assert.equal(saved.length, 4);
});

test("sin carpeta opcional conserva el download actual sin copiarlo", async () => {
  const original = path.resolve(import.meta.dirname, "../.local/download-temporal");
  const download = { path: async () => original, saveAs: async () => { throw new Error("No debe copiar sin carpeta."); } };
  assert.equal(await assistantExportPath(download, 1440, "pdf", ""), original);
});

test("rechaza una carpeta relativa o un nombre fuera de los anchos y formatos aprobados antes de escribir", async () => {
  const download = { path: async () => { throw new Error("No debe consultar el archivo."); },
    saveAs: async () => { throw new Error("No debe copiar el archivo."); } };
  await assert.rejects(assistantExportPath(download, 1440, "pdf", ".local/exportes"), /debe ser absoluta/);
  const directory = path.resolve(import.meta.dirname, "../.local/exportes");
  await assert.rejects(assistantExportPath(download, 768, "pdf", directory), /Exporte E8b inválido/);
  await assert.rejects(assistantExportPath(download, 390, "../../otro", directory), /Exporte E8b inválido/);
});
