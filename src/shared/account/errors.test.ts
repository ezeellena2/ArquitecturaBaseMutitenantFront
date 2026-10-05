import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { loginMethodErrorField } from "./errors";

const rejected = (code: string, status = 400) => new ApiError(status, { status, code, detail: "Texto del back." });

describe("loginMethodErrorField", () => {
  // Tablero Cuenta-Verificar: el código incorrecto va debajo de los casilleros; lo demás, en la franja del diálogo.
  it("el código incorrecto va en el campo del código", () => {
    expect(loginMethodErrorField(rejected("Auth.LoginCode.Invalid"))).toBe("code");
  });

  it("el código vencido, el ya usado, los intentos agotados y lo que no es del back no tienen campo", () => {
    expect(loginMethodErrorField(rejected("Auth.LoginCode.Expired"))).toBeNull();
    expect(loginMethodErrorField(rejected("Auth.LoginCode.AlreadyUsed"))).toBeNull();
    expect(loginMethodErrorField(rejected("Auth.LoginCode.TooManyAttempts", 429))).toBeNull();
    expect(loginMethodErrorField(new Error("bug"))).toBeNull();
  });
});
