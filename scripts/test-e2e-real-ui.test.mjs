import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { fillOtp } from "./test-e2e-real-ui.mjs";

test("el código espera los controles que aparecen después del título", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<h1>Revisá tu correo</h1>");
    const entry = fillOtp(page, "123456").then(() => null, error => error);
    // La carga del paso es independiente de la entrega del correo. Sin sleeps ni red simulada.
    await page.evaluate(() => {
      const group = document.createElement("div");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Código");
      for (let index = 0; index < 6; index++) group.append(document.createElement("input"));
      document.body.append(group);
    });
    assert.equal(await entry, null);
    assert.deepEqual(await page.getByRole("group", { name: "Código" }).locator("input").evaluateAll(inputs => inputs.map(input => input.value)),
      ["1", "2", "3", "4", "5", "6"]);
  } finally { await browser.close(); }
});
