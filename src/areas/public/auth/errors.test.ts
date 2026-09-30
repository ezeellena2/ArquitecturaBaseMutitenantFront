import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { loginCodeErrorKey } from "./errors";

describe("errores del código de ingreso", () => {
  it.each([
    ["Auth.LoginCode.Invalid", "login.codeInvalid"],
    ["Auth.LoginCode.Expired", "login.codeExpired"],
    ["Auth.LoginCode.AlreadyUsed", "login.codeAlreadyUsed"],
    ["Auth.LoginCode.TooManyAttempts", "login.tooManyAttempts"],
    ["Auth.LoginCode.ResendTooSoon", "login.resendTooSoon"],
    ["Auth.LoginCode.TooManyRequests", "login.tooManyRequests"],
    ["Http.TooManyRequests", "login.networkRateLimited"],
    ["Validation.Failed", "login.codeInvalid"],
  ])("elige el estado por código %s", (code, expected) => {
    expect(loginCodeErrorKey(new ApiError(400, { code, detail: "No usar el texto de la respuesta" }))).toBe(expected);
  });

  it("distingue red y error desconocido sin depender del mensaje", () => {
    expect(loginCodeErrorKey(ApiError.network())).toBe("errors:network");
    expect(loginCodeErrorKey(new ApiError(500, { code: "Other.Failure", detail: "unknown" }))).toBe("errors:server");
  });
});
