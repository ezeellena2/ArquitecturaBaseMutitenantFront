import { describe, expect, it } from "vitest";
import { accountPaths } from "./accountContract";
import type { AddLoginMethodRequest, RequestLoginCodeRequest, SubmitAccountRecoveryRequest } from "./types";

describe("contrato E8", () => {
  it("permite cuerpos reales de teléfono y conserva correo, sin inferir DTO nuevos", () => {
    // Esta prueba también compila: una rama Phone generada como Record<string, never> rompe estos cuerpos.
    const phone = { country: "AR", number: "11 2345 6789" };
    const login = { phone, channel: "whatsapp" } satisfies RequestLoginCodeRequest;
    const add = { phone, channel: "whatsapp" } satisfies AddLoginMethodRequest;
    const email = { email: "persona@example.com" } satisfies AddLoginMethodRequest;
    const recovery = { phone, channel: "whatsapp", nonce: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", previousPhone: phone } satisfies SubmitAccountRecoveryRequest;
    expect([login.phone, add.phone, recovery.previousPhone]).toEqual([phone, phone, phone]);
    expect(email.email).toBe("persona@example.com");
    // El canje del enlace de un solo uso salió con la base de la 12 (179): el bot ya no manda enlaces.
    expect(Object.values(accountPaths).filter((path) => path.includes("login-link"))).toEqual([]);
  });
});
