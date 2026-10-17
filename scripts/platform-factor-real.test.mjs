import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { base32Decode, checkByLabel, createFactorKeeper, stepAt, totp } from "./platform-factor-real.mjs";

// RFC 6238, apéndice B: el secreto ASCII «12345678901234567890» con SHA-1; los seis dígitos de abajo de cada código.
const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("el TOTP coincide con los vectores de la RFC 6238", () => {
  assert.equal(base32Decode(rfcSecret).toString("ascii"), "12345678901234567890");
  assert.equal(totp(rfcSecret, stepAt(59_000)), "287082");
  assert.equal(totp(rfcSecret, stepAt(1_111_111_109_000)), "081804");
  assert.equal(totp(rfcSecret, stepAt(1_234_567_890_000)), "005924");
  assert.equal(totp("gezd gnbv gy3t qojq gezd gnbv gy3t qojq", stepAt(2_000_000_000_000)), "279037");
});

test("no repite un intervalo ya usado: espera al siguiente", async () => {
  let clock = 1_000_000_000_000 + 5_000; const waits = [];
  const keeper = createFactorKeeper({ now: () => clock, sleep: async (ms) => { waits.push(ms); clock += ms; } });
  keeper.remember("operador@example.test", rfcSecret);
  const first = await keeper.code("operador@example.test");
  const second = await keeper.code("operador@example.test");
  assert.equal(waits.length, 1);
  assert.notEqual(first, second);
  assert.equal(second, totp(rfcSecret, stepAt(clock)));
});

test("el código inválido no sirve en el intervalo actual ni en los vecinos", () => {
  const clock = 1_111_111_109_000; const keeper = createFactorKeeper({ now: () => clock });
  keeper.remember("operador@example.test", rfcSecret);
  const code = keeper.invalidCode("operador@example.test");
  assert.match(code, /^\d{6}$/u);
  for (const offset of [-2, -1, 0, 1, 2]) assert.notEqual(code, totp(rfcSecret, stepAt(clock) + offset));
  assert.notEqual(keeper.invalidCode("operador@example.test", 1), code, "Cada intento escribe otro código.");
  assert.throws(() => createFactorKeeper().invalidCode("otro@example.test"));
});

test("guardar los códigos conserva el intervalo y cada código de recuperación sale una vez", async () => {
  let clock = 1_000_000_000_000; const keeper = createFactorKeeper({ now: () => clock, sleep: async (ms) => { clock += ms; } });
  keeper.remember("operador@example.test", rfcSecret);
  await keeper.code("operador@example.test");
  keeper.rememberCodes("operador@example.test", ["AAAA-BBBB", "CCCC-DDDD"]);
  const before = clock;
  await keeper.code("operador@example.test");
  assert.ok(clock > before, "El intervalo usado para activar no se vuelve a usar.");
  assert.equal(keeper.takeRecoveryCode("operador@example.test"), "AAAA-BBBB");
  assert.deepEqual(keeper.recoveryCodes("operador@example.test"), ["CCCC-DDDD"]);
  assert.throws(() => createFactorKeeper().takeRecoveryCode("otro@example.test"));
  await assert.rejects(createFactorKeeper().code("otro@example.test"));
});

// CheckboxField: la etiqueta tapa la casilla para que toda la fila se pueda tocar. check() sobre la casilla choca con ella;
// el ayudante la marca como una persona, con un clic en la etiqueta, y comprueba que quedó marcada.
test("marca una casilla de CheckboxField con un clic en su etiqueta", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>.fila{position:relative;padding:9px}label::after{content:"";position:absolute;inset:0}</style>
      <div class="fila"><button type="button" role="checkbox" aria-checked="false" id="guardados"
        onclick="this.setAttribute('aria-checked', String(this.getAttribute('aria-checked') !== 'true'))"></button>
      <label for="guardados">Los guardé en un lugar seguro</label></div>`);
    const checkbox = page.getByRole("checkbox", { name: "Los guardé en un lugar seguro", exact: true });
    await assert.rejects(checkbox.check({ timeout: 500 }), { name: "TimeoutError" });
    await checkByLabel(page, "Los guardé en un lugar seguro", { timeout: 2_000 });
    assert.equal(await checkbox.getAttribute("aria-checked"), "true");
    // Ya marcada, no la desmarca.
    await checkByLabel(page, "Los guardé en un lugar seguro", { timeout: 2_000 });
    assert.equal(await checkbox.getAttribute("aria-checked"), "true");
  } finally { await browser.close(); }
});
