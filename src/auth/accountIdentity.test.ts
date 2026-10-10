import { describe, expect, it } from "vitest";
import { accountIdentity } from "./accountIdentity";

describe("identidad visible de la cuenta", () => {
  it("Phone principal precede al correo de respaldo y no inventa inicial ni segunda línea", () => {
    expect(accountIdentity({ displayName: null, email: "respaldo@example.test", maskedPrimaryPhone: "•••• 4521" })).toEqual({
      name: "•••• 4521", detail: null, avatarInitials: "—", avatarMuted: true,
    });
  });
  it("nombre presente conserva su inicial y usa la máscara recibida como contacto", () => {
    expect(accountIdentity({ displayName: " Ana Pérez ", email: "respaldo@example.test", maskedPrimaryPhone: "•••• 4521" })).toEqual({
      name: "Ana Pérez", detail: "•••• 4521", avatarInitials: "A", avatarMuted: false,
    });
  });
  it("sin máscara conserva la identidad de correo y su inicial", () => {
    expect(accountIdentity({ displayName: null, email: "ana@example.test", maskedPrimaryPhone: null })).toEqual({
      name: "ana@example.test", detail: "ana@example.test", avatarInitials: "A", avatarMuted: false,
    });
  });
  it.each([undefined, { displayName: null, email: null }, { displayName: " ", email: null, maskedPrimaryPhone: null }])("sin identidad conserva raya apagada y deja el vacío a i18n", (account) => {
    expect(accountIdentity(account)).toEqual({ name: "", detail: null, avatarInitials: "—", avatarMuted: true });
  });
});
