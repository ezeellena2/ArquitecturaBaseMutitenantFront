import { describe, expect, it } from "vitest";
import { accountPaths } from "./accountContract";
import type { AddLoginMethodRequest, LoginLinkRedeemResponse, RequestLoginCodeRequest, SubmitAccountRecoveryRequest } from "./types";

describe("contrato E8", () => {
  it("permite cuerpos reales de teléfono y conserva correo, sin inferir DTO nuevos", () => {
    // Esta prueba también compila: una rama Phone generada como Record<string, never> rompe estos cuerpos.
    const phone = { country: "AR", number: "11 2345 6789" };
    const login = { phone, channel: "whatsapp" } satisfies RequestLoginCodeRequest;
    const add = { phone, channel: "whatsapp" } satisfies AddLoginMethodRequest;
    const email = { email: "persona@example.com" } satisfies AddLoginMethodRequest;
    const recovery = { phone, channel: "whatsapp", nonce: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", previousPhone: phone } satisfies SubmitAccountRecoveryRequest;
    const redeemed = { access: "consumer" } satisfies LoginLinkRedeemResponse;
    expect([login.phone, add.phone, recovery.previousPhone]).toEqual([phone, phone, phone]);
    expect(email.email).toBe("persona@example.com");
    expect(redeemed.access).toBe("consumer");
    expect(accountPaths.loginLinkPreview).toBe("/api/auth/login-link/preview");
    expect(accountPaths.loginLinkRedeem).toBe("/api/auth/login-link/redeem");
  });
});
