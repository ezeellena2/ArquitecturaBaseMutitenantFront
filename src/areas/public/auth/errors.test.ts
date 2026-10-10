import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { businessSignupErrorField, loginCodeErrorKey, loginCodeMessage } from "./errors";

describe("errores del código de ingreso", () => {
  it.each([
    ["Auth.LoginCode.Invalid", "login.codeInvalid"],
    ["Auth.LoginCode.Expired", "login.codeExpired"],
    ["Auth.LoginCode.AlreadyUsed", "login.codeAlreadyUsed"],
    ["Auth.LoginCode.TooManyAttempts", "login.tooManyAttempts"],
    ["Auth.LoginCode.ResendTooSoon", "login.resendTooSoon"],
    ["Auth.LoginCode.TooManyRequests", "login.tooManyRequests"],
    ["Http.TooManyRequests", "login.networkRateLimited"],
  ])("elige el estado por código %s", (code, expected) => {
    expect(loginCodeErrorKey(new ApiError(400, { code, detail: "No usar el texto de la respuesta" }))).toBe(expected);
  });

  it("distingue red y error desconocido sin depender del mensaje", () => {
    expect(loginCodeErrorKey(ApiError.network())).toBe("errors:network");
    expect(loginCodeErrorKey(new ApiError(500, { code: "Other.Failure", detail: "unknown" }))).toBe("errors:server");
  });

  it.each([
    [undefined, "errors:server"],
    [{ returnUrl: ["Código incorrecto como texto ajeno"] }, "errors:server"],
    [{ access: ["Acceso incorrecto"] }, "errors:server"],
    [{ code: [] }, "errors:server"],
    [{ code: ["Revisá los dígitos"] }, "login.codeInvalid"],
  ])("Validation.Failed sólo identifica OTP por errors.code: %j", (errors, expected) => {
    expect(loginCodeErrorKey(new ApiError(400, { code: "Validation.Failed", errors }))).toBe(expected);
  });
});

// El mensaje de la franja del paso del código, igual en el ingreso y en los dos registros (tablero Ingreso): el texto
// del código y, debajo, lo que queda o lo que se puede hacer. Los textos del paso del código están en un solo lugar,
// common:code, que comparten el ingreso, los registros y los diálogos de Mi cuenta.
describe("mensaje del código", () => {
  const t = ((key: string, options?: Record<string, unknown>) => options?.count === undefined ? key : `${key}:${String(options.count)}`) as unknown as TFunction;

  it.each([
    ["Auth.LoginCode.Invalid", { attemptsLeft: 3 }, "login.codeInvalid", ["common:code.attemptsLeft:3"]],
    ["Auth.LoginCode.Expired", {}, "login.codeExpired", []],
    ["Auth.LoginCode.TooManyAttempts", {}, "login.tooManyAttempts", ["auth:login.requestNewCode"]],
    ["Identity.Account.LockedOut", {}, "login.accountLocked", ["auth:login.tryLater"]],
    ["Identity.Account.Suspended", {}, "login.accountSuspended", ["auth:login.contactSupport"]],
  ])("%s dice su texto y sus líneas de abajo", (code, extra, text, details) => {
    expect(loginCodeMessage(new ApiError(400, { code, ...extra }), t)).toEqual({ text, details });
  });
});

// Tablero Registro-Empresa: lo que el back rechaza de la dirección o del CUIT va debajo de ese campo, con el texto del
// tablero; lo demás (el límite, el registro cerrado), en su lugar.
describe("rechazos del registro de empresas", () => {
  it.each([
    ["Tenancy.TenantSlug.Reserved", "slug", "businessSignup.slugReserved"],
    ["Tenancy.TenantSlug.Taken", "slug", "businessSignup.slugTaken"],
    ["Tenancy.TenantSlug.Invalid", "slug", "businessSignup.slugInvalid"],
    ["TaxIds.TaxId.Invalid", "taxNumber", "businessSignup.taxIdInvalid"],
  ])("%s va en el campo %s", (code, field, key) => {
    expect(businessSignupErrorField(new ApiError(409, { code }))).toEqual({ field, key });
  });

  it("el límite, el registro cerrado y lo que no es del back no tienen campo", () => {
    expect(businessSignupErrorField(new ApiError(409, { code: "Tenancy.Organization.LimitReached" }))).toBeNull();
    expect(businessSignupErrorField(new ApiError(403, { code: "Auth.BusinessSignup.Closed" }))).toBeNull();
    expect(businessSignupErrorField(new Error("bug"))).toBeNull();
  });
});
