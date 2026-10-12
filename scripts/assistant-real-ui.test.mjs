import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { assistantExportPath, acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";
import { chromium } from "playwright";

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
