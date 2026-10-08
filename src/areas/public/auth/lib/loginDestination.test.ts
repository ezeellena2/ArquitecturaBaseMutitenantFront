import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { loginDestinationErrorField, sameLoginDestination, toLoginDestinationRequest } from "./loginDestination";

describe("destino de ingreso", () => {
  it("elige un solo destino y canal sin normalizar el teléfono en el navegador", () => {
    expect(toLoginDestinationRequest({ type: "email", email: "ana@example.test" })).toEqual({ email: "ana@example.test" });
    expect(toLoginDestinationRequest({ type: "phone", phone: { country: "AR", number: "011 15-2345-6789" } }))
      .toEqual({ phone: { country: "AR", number: "011 15-2345-6789" }, channel: "whatsapp" });
  });

  it("compara datos completos para conservar una clave sólo al reintentar la misma operación", () => {
    const phone = { type: "phone", phone: { country: "AR", number: "11 2345-6789" } } as const;
    expect(sameLoginDestination(phone, { ...phone, phone: { ...phone.phone } })).toBe(true);
    expect(sameLoginDestination(phone, { ...phone, phone: { ...phone.phone, country: "UY" } })).toBe(false);
    expect(sameLoginDestination(phone, { ...phone, phone: { ...phone.phone, number: "11 9876-5432" } })).toBe(false);
    expect(sameLoginDestination(phone, { type: "email", email: "ana@example.test" })).toBe(false);
    expect(sameLoginDestination({ type: "email", email: "a@example.test" }, { type: "email", email: "b@example.test" })).toBe(false);
  });

  it.each(["Users.Phone.Invalid", "Users.Phone.NotMobile", "WhatsApp.Phone.CountryNotAllowed",
    "Identity.LoginMethod.PhoneAlreadyUsed", "Auth.Signup.PhoneTaken", "Auth.LoginCode.PhoneAccountNotFound"])(
    "ubica %s bajo phone sin decidir por el texto", (code) => {
      expect(loginDestinationErrorField(new ApiError(400, { code, detail: "Texto cualquiera" }))).toBe("phone");
    });

  it("conserva errores de validación phone del servidor y deja límites/indisponibilidad en la franja", () => {
    expect(loginDestinationErrorField(new ApiError(400, { code: "Validation.Failed", errors: { phone: ["No habilitado"] } }))).toBe("phone");
    expect(loginDestinationErrorField(new ApiError(429, { code: "Auth.LoginCode.TooManyRequests" }))).toBeNull();
    expect(loginDestinationErrorField(new ApiError(400, { code: "Auth.LoginMethod.ChannelUnavailable" }))).toBeNull();
    expect(loginDestinationErrorField(new Error("phone inválido"))).toBeNull();
  });
});
