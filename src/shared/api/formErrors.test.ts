import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./ApiError";
import { applyApiErrorToForm } from "./formErrors";

describe("applyApiErrorToForm", () => {
  it("ubica Validation.Failed en los campos mapeados", () => {
    const setError = vi.fn();
    const error = new ApiError(400, {
      code: "Validation.Failed",
      errors: { email: ["Ingresá un correo válido."], code: ["Ingresá el código."] },
    });

    expect(applyApiErrorToForm(error, setError, { email: "contactEmail", code: "verificationCode" })).toBe(true);
    expect(setError).toHaveBeenCalledWith("contactEmail", { type: "server", message: "Ingresá un correo válido." });
    expect(setError).toHaveBeenCalledWith("verificationCode", { type: "server", message: "Ingresá el código." });
  });

  it("también ubica los errors adjuntos a un código de negocio", () => {
    const setError = vi.fn();
    const error = new ApiError(409, {
      code: "Users.Email.AlreadyTaken",
      errors: { email: ["Ese correo ya está en uso."] },
    });

    expect(applyApiErrorToForm(error, setError, { email: "email" })).toBe(true);
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Ese correo ya está en uso." });
  });

  it("devuelve false si no hay errores por campo", () => {
    const setError = vi.fn();
    expect(applyApiErrorToForm(new ApiError(429, { code: "Http.TooManyRequests" }), setError, {})).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("deja el error general disponible si algún campo no encaja en el formulario", () => {
    const setError = vi.fn();
    const error = new ApiError(400, {
      code: "Validation.Failed",
      errors: { email: ["Correo inválido"], unknown: ["Valor inválido"] },
    });

    expect(applyApiErrorToForm(error, setError, { email: "email" })).toBe(false);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Correo inválido" });
  });
});
