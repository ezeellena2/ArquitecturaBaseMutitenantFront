import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";

// E9: el segundo factor del operador en el E2E real y en los recorridos. Cada corrida usa operadores del entorno aislado:
// el secreto y los códigos de recuperación que muestra la pantalla viven solo en la memoria de este proceso, nunca en
// archivos, logs ni capturas, y nunca se le pide su clave a un operador real.

const base32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const stepSeconds = 30;

export function base32Decode(text) {
  const clean = text.replace(/[\s=]/gu, "").toUpperCase();
  let bits = 0; let value = 0; const bytes = [];
  for (const char of clean) {
    const index = base32.indexOf(char);
    assert.ok(index >= 0, "La clave del autenticador no es base32.");
    value = (value << 5) | index; bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(bytes);
}

/** TOTP de la RFC 6238 con SHA-1, seis dígitos e intervalos de 30 segundos, como el back. */
export function totp(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

export const stepAt = (timeMs) => Math.floor(timeMs / 1000 / stepSeconds);

/** Lo que el proceso sabe de cada operador: su secreto, el último intervalo usado y sus códigos de recuperación. */
export function createFactorKeeper({ now = () => Date.now(), sleep = delay } = {}) {
  const operators = new Map();
  return {
    remember(email, secret, recoveryCodes = []) { operators.set(email, { secret, lastStep: -1, recoveryCodes: [...recoveryCodes] }); },
    /** Los ocho códigos del alta, sin tocar el intervalo ya usado para activarla. */
    rememberCodes(email, recoveryCodes) {
      const operator = operators.get(email);
      assert.ok(operator, "El operador no configuró su autenticador en esta corrida del entorno aislado.");
      operator.recoveryCodes = [...recoveryCodes];
    },
    knows: (email) => operators.has(email),
    forget: (email) => operators.delete(email),
    /** El código del intervalo actual; si ya se usó, espera al siguiente (el back no acepta un intervalo dos veces). */
    async code(email) {
      const operator = operators.get(email);
      assert.ok(operator, "El operador no configuró su autenticador en esta corrida del entorno aislado.");
      let step = stepAt(now());
      while (step <= operator.lastStep) {
        await sleep(((operator.lastStep + 1) * stepSeconds * 1000 - now()) + 250);
        step = stepAt(now());
      }
      operator.lastStep = step;
      return totp(operator.secret, step);
    },
    /** Un código de recuperación sin usar; deja de estar disponible al tomarlo. */
    takeRecoveryCode(email) {
      const operator = operators.get(email);
      assert.ok(operator?.recoveryCodes.length, "No quedan códigos de recuperación de este operador en esta corrida.");
      return operator.recoveryCodes.shift();
    },
    recoveryCodes: (email) => [...(operators.get(email)?.recoveryCodes ?? [])],
  };
}

export const factorKeeper = createFactorKeeper();

/**
 * Después de verificar el código del correo en la puerta de Plataforma: configura el autenticador la primera vez (lee la
 * clave de la pantalla, guarda los ocho códigos en memoria y marca «Los guardé»), o escribe el código del intervalo. Si el
 * back todavía no pide el segundo factor, el ingreso sigue solo y no hace nada.
 */
export async function completeOperatorFactor(page, email, { keeper = factorKeeper, timeout = 30_000 } = {}) {
  const setup = page.getByRole("heading", { name: "Protegé tu cuenta de operador", exact: true });
  const verify = page.getByRole("heading", { name: "Verificación en dos pasos", exact: true });
  const reached = await Promise.race([
    setup.waitFor({ timeout }).then(() => "setup", () => null),
    verify.waitFor({ timeout }).then(() => "verify", () => null),
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout }).then(() => "none", () => null),
  ]);
  assert.ok(reached, "El ingreso del operador no llegó al segundo factor ni a Plataforma.");
  if (reached === "none") return "none";
  if (reached === "setup") {
    const key = await page.getByText(/^[A-Z2-7]{4}( [A-Z2-7]{1,4})+$/u).first().innerText();
    keeper.remember(email, key.replace(/\s+/gu, ""));
    await fillOtp(page, await keeper.code(email));
    await page.getByRole("button", { name: "Activar", exact: true }).click();
    const list = page.getByRole("list", { name: "Códigos de recuperación", exact: true });
    await list.waitFor({ timeout });
    const codes = (await list.getByRole("listitem").allInnerTexts()).map((code) => code.trim());
    assert.equal(codes.length, 8);
    assert.ok(codes.every((code) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/u.test(code)));
    keeper.rememberCodes(email, codes);
    await page.getByRole("checkbox", { name: "Los guardé en un lugar seguro", exact: true }).check();
    await page.getByRole("button", { name: "Entrar a la plataforma", exact: true }).click();
    return "setup";
  }
  await fillOtp(page, await keeper.code(email));
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  return "verify";
}
