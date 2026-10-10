import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { chromium } from "playwright";
import { editableSettings, restorableSettings, sameSettings, selectSetting, withRestoredSettings } from "./test-e2e-real-whatsapp-settings.mjs";

const original = { consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 7,
  salesEmail: "original-sales@example.test", supportEmail: "original-support@example.test", version: 18 };

test("captura sólo los cinco valores raw y conserva contactos existentes y políticas al restaurar", () => {
  const captured = editableSettings(original);
  assert.deepEqual(captured, { consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 7,
    salesEmail: "original-sales@example.test", supportEmail: "original-support@example.test" });
  assert.deepEqual(restorableSettings(captured), captured);
  assert.equal(sameSettings(original, { ...original, version: 99 }), true);
  for (const [field, value] of Object.entries({ consumerSignup: "Closed", businessSignup: "Open", maxOwnedOrganizations: 8,
    salesEmail: "changed@example.test", supportEmail: "changed@example.test" }))
    assert.equal(sameSettings(original, { ...original, [field]: value }), false);
});

test("enriquece sólo contactos null sin modificar la baseline ni restaurar una versión vieja", () => {
  for (const field of ["salesEmail", "supportEmail"]) {
    const baseline = editableSettings({ ...original, [field]: null });
    const restored = restorableSettings(baseline);
    assert.equal(baseline[field], null);
    assert.match(restored[field], /^e8-settings-(sales|support)@example\.test$/);
    assert.equal(restored[field === "salesEmail" ? "supportEmail" : "salesEmail"], original[field === "salesEmail" ? "supportEmail" : "salesEmail"]);
    assert.equal(Object.hasOwn(restored, "version"), false);
    assert.equal(restored.consumerSignup, original.consumerSignup);
    assert.equal(restored.businessSignup, original.businessSignup);
    assert.equal(restored.maxOwnedOrganizations, original.maxOwnedOrganizations);
  }
});

for (const failureAt of ["prepare", "body", "success"]) test(`restaura después de ${failureAt} y espera antes de entregar resultado`, async () => {
  const order = []; const failure = new Error("Fallo principal"); const snapshot = { ...original };
  const work = withRestoredSettings({
    read: async () => { order.push("read"); return snapshot; },
    prepare: async (baseline) => {
      order.push("prepare"); assert.deepEqual(baseline, editableSettings(original));
      snapshot.consumerSignup = "Closed"; snapshot.version = 19;
      if (failureAt === "prepare") throw failure;
    },
    body: async () => { order.push("body"); if (failureAt === "body") throw failure; return "completo"; },
    restore: async (baseline) => { await Promise.resolve(); order.push("restore"); assert.deepEqual(baseline, editableSettings(original)); },
    close: async () => { order.push("close"); },
  });
  if (failureAt === "success") assert.equal(await work, "completo");
  else await assert.rejects(work, (error) => error === failure);
  assert.deepEqual(order, failureAt === "prepare" ? ["read", "prepare", "restore", "close"] : ["read", "prepare", "body", "restore", "close"]);
});

test("sin baseline legible no prepara, ejecuta ni inventa una restauración", async () => {
  const failure = new Error("Lectura fallida"); const unexpected = async () => assert.fail("No debe ejecutarse");
  let closed = false;
  await assert.rejects(withRestoredSettings({ read: async () => { throw failure; }, prepare: unexpected, body: unexpected, restore: unexpected, close: async () => { closed = true; } }), (error) => error === failure);
  assert.equal(closed, true);
});

test("un fallo de restauración después de éxito sigue siendo un fallo", async () => {
  const failure = new Error("Restauración fallida");
  await assert.rejects(withRestoredSettings({ read: async () => original, prepare: async () => {}, body: async () => "completo", restore: async () => { throw failure; } }), (error) => error === failure);
});

test("un fallo de cierre no oculta los errores del recorrido y restauración", async () => {
  const primary = new Error("Primario"); const restore = new Error("Restauración"); const close = new Error("Cierre");
  await assert.rejects(withRestoredSettings({ read: async () => original, prepare: async () => {},
    body: async () => { throw primary; }, restore: async () => { throw restore; }, close: async () => { throw close; } }),
  (error) => error instanceof AggregateError && error.errors[0] === primary && error.errors[1] === restore && error.errors[2] === close);
});

for (const failureAt of ["prepare", "body"]) test(`conserva fallos de ${failureAt} y restauración sin rechazos sin handler`, () => {
  const moduleUrl = new URL("./test-e2e-real-whatsapp-settings.mjs", import.meta.url).href;
  const script = `import assert from 'node:assert/strict'; import { withRestoredSettings } from ${JSON.stringify(moduleUrl)};
    const first = new Error('primario'); const restore = new Error('restauración');
    await assert.rejects(withRestoredSettings({ read: async () => ({}),
      prepare: async () => { ${failureAt === "prepare" ? "throw first;" : ""} },
      body: async () => { throw first; },
      restore: async () => { await new Promise(setImmediate); throw restore; }
    }), (error) => error instanceof AggregateError && error.errors[0] === first && error.errors[1] === restore);
    await new Promise(setImmediate);`;
  execFileSync(process.execPath, ["--unhandled-rejections=strict", "--input-type=module", "--eval", script], { stdio: "pipe" });
});

test("selector accesible acepta descripciones Radix y evita opciones con otro prefijo", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<button role="combobox" aria-label="Alta de organizaciones" onclick="document.querySelector('[role=listbox]').hidden=false">Cerrada</button>
      <div role="listbox" hidden><button role="option" onclick="choose(this)"><span>Abierta especial</span></button>
      <button role="option" onclick="choose(this)"><span>Abierta</span><span>Las organizaciones se crean al instante.</span></button></div>
      <script>function choose(option) { document.querySelector('[role=combobox]').innerHTML='<span>'+option.firstElementChild.textContent+'</span>'; document.querySelector('[role=listbox]').hidden=true; }
      document.querySelector('[role=combobox]').onkeydown=(event)=>{if(event.key==='Enter') document.querySelector('[role=listbox]').hidden=false;};</script>`);
    await selectSetting(page, "Alta de organizaciones", "Abierta");
    assert.equal(await page.getByRole("combobox", { name: "Alta de organizaciones" }).innerText(), "Abierta");
    await selectSetting(page, "Alta de organizaciones", "Abierta");
    assert.equal(await page.getByRole("listbox").count(), 0);
  } finally { await browser.close(); }
});
