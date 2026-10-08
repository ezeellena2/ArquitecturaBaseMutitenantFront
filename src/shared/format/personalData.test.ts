import { describe, expect, it } from "vitest";
import { maskEmail, maskPhone } from "./personalData";

it.each([["+5491155554521", "•••• 4521"], ["•••• 4521", "•••• 4521"], ["•••• 21", "••••"], ["123", "••••"]])("enmascara Phone %s como el backend", (value, expected) => {
  expect(maskPhone(value)).toBe(expected);
});

// Tableros Cuenta-Verificar y Cuenta-Baja («Te mandamos un código a lu•••@gmail.com»), como `PersonalDataMask.Email` del back.
describe("maskEmail", () => {
  it("deja dos letras y el dominio, o una si la parte de antes de la @ es corta", () => {
    expect(maskEmail("lucia.trabajo@gmail.com")).toBe("lu•••@gmail.com");
    expect(maskEmail("ab@x.com")).toBe("a•••@x.com");
  });

  it("lo que ya viene tapado no muestra más, y sin una @ válida no muestra nada", () => {
    expect(maskEmail("a***@example.test")).toBe("a•••@example.test");
    expect(maskEmail("•••@example.test")).toBe("•••@example.test");
    expect(maskEmail("sin-arroba")).toBe("•••");
    expect(maskEmail("lucia@")).toBe("•••");
  });
});
