import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { startTourServer } from "./servidor.mjs";

test("cada paso abre el tablero en su estado, avanza con la flecha y guarda por dónde vas", async () => {
  const progressFile = path.join(mkdtempSync(path.join(os.tmpdir(), "recorrido-")), "progreso.json");
  const tour = await startTourServer({ progressFile });
  const target = tour.steps.find((step) => step.file === "Ingreso.dc.html" && step.state === "estado «Código enviado»");
  writeFileSync(progressFile, JSON.stringify({ index: target.index - 1 }));
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(tour.url);
    await page.getByRole("button", { name: "Siguiente ›" }).waitFor();
    await page.keyboard.press("ArrowRight");

    await assert.doesNotReject(() => page.getByText(`Paso ${target.index + 1} de ${tour.steps.length}`).waitFor());
    await page.getByText("Mostrando: estado «Código enviado»").waitFor();
    const board = page.frameLocator("iframe");
    await board.getByText(/Revisá tu (correo|WhatsApp)/).first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(300);
    assert.equal(JSON.parse(readFileSync(progressFile, "utf8")).index, target.index);

    const platform = tour.steps.find((step) => step.kind === "page" && step.page === "Plataforma");
    await page.getByRole("combobox", { name: "Ir a una página" }).selectOption(String(platform.index));
    await page.getByRole("heading", { level: 2, name: "Plataforma" }).waitFor();
  } finally {
    await browser.close();
    await tour.close();
  }
});
