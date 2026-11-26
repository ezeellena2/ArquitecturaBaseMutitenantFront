import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { invitationPerson } from "@/shared/hooks/useResendInvitation";
import { configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { ResendInvitationDialog, type InvitationChannel } from "./InvitationDelivery";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const resend = { start: vi.fn(), confirming: { trigger: null }, confirm: vi.fn(), close: vi.fn() };

function renderResend(displayName: string, contact: string, channel: InvitationChannel = "email") {
  renderWithProviders(<ResendInvitationDialog resend={resend} name={displayName || contact} person={invitationPerson(displayName)}
    channel={channel} pending={false} />);
  return screen.getByRole("dialog");
}

// Tableros `-Base2`, «Reenviar una invitación sin confirmar»: con quién revisar es el nombre de la persona y, sin nombre,
// «la persona». La invitación de alguien sin nombre trae en `displayName` su correo o su teléfono, que el diálogo no dice.
describe("ResendInvitationDialog", () => {
  it("con nombre pide revisar con la persona por su nombre", () => {
    expect(renderResend("Sofía Herrera", "sofia@example.test")).toHaveTextContent(
      "No sabemos si le llegó la anterior: el servidor de correo no confirmó el envío. Revisá con Sofía Herrera antes de reenviarla, así no le llegan dos.");
  });

  it("sin nombre, con el correo en displayName, dice «la persona»", () => {
    const dialog = renderResend("e2e-sin-nombre@example.test", "e2e-sin-nombre@example.test");
    expect(dialog).toHaveTextContent(
      "No sabemos si le llegó la anterior: el servidor de correo no confirmó el envío. Revisá con la persona antes de reenviarla, así no le llegan dos.");
    expect(screen.getByRole("dialog", { name: "¿Reenviar la invitación a e2e-sin-nombre@example.test?" })).toBe(dialog);
  });

  it("sin nombre, con el teléfono en displayName, dice «la persona»", () => {
    expect(renderResend("+5493515550200", "+5493515550200", "whatsapp")).toHaveTextContent(
      "No sabemos si le llegó la anterior: WhatsApp no confirmó el envío. Revisá con la persona antes de reenviarla, así no le llegan dos.");
  });

  it("invitationPerson deja solo un nombre", () => {
    expect([" Sofía Herrera ", "Ñandú", "sofia@example.test", "+54 9 351 555-0200", "", "   ", null, undefined].map(invitationPerson))
      .toEqual(["Sofía Herrera", "Ñandú", null, null, null, null, null, null]);
  });
});
