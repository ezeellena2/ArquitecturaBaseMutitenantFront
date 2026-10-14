import { describe, expect, it } from "vitest";
import type { WhatsAppConversationRowResponse } from "../../api/types";
import { composerState, initialsOf, rowAssignment, rowDescriptors, templatePreview, whatsappLink } from "./conversation";

const row = (overrides: Partial<WhatsAppConversationRowResponse> = {}): WhatsAppConversationRowResponse => ({
  id: "c", inbox: "Customers", contactId: null, contactName: "Martina López", displayNumber: "+5491155556203", tags: [], lastMessagePreview: null,
  lastMessageAtUtc: "2026-10-12T13:42:00Z", unread: false, team: { id: "t", name: "Ventas" }, assignee: { id: "yo", name: "Lucía Fernández" },
  linkedToAccount: false, windowOpenUntilUtc: "2999-01-01T00:00:00Z", readOnly: false, accountId: null, version: 1,
  channel: { id: "n", displayNumber: "+5493515550200", status: "Connected" }, assignedToMe: true, ...overrides,
});
const none = { paymentRequired: false, windowClosed: false };

describe("estado del compositor", () => {
  it("el número desconectado manda sobre todo lo demás (D7)", () => {
    expect(composerState(row({ readOnly: true, assignee: { id: "otra", name: "Tomás" }, assignedToMe: false, windowOpenUntilUtc: null }), { paymentRequired: true, windowClosed: true }))
      .toEqual({ kind: "readOnly" });
    expect(composerState(row({ channel: { id: "n", displayNumber: "+5493515550200", status: "Disconnected" } }), none)).toEqual({ kind: "readOnly" });
  });

  it("si lo atiende otra persona solo queda la nota: lo dice `assignedToMe` (CC13)", () => {
    expect(composerState(row({ assignee: { id: "otra", name: "Tomás Acosta" }, assignedToMe: false }), none)).toEqual({ kind: "takenByOther", name: "Tomás Acosta" });
    expect(composerState(row({ assignee: { id: "otra", name: "Lucía Fernández" }, assignedToMe: true }), none)).toEqual({ kind: "open" });
  });

  it("sin tomar se puede escribir: mandar lo toma", () => {
    expect(composerState(row({ assignee: null, assignedToMe: false }), none)).toEqual({ kind: "open" });
  });

  it("pasadas las 24 h, o sin ventana, o si el back lo dijo, solo plantilla", () => {
    expect(composerState(row({ windowOpenUntilUtc: "2020-01-01T00:00:00Z" }), none)).toEqual({ kind: "windowClosed" });
    expect(composerState(row({ windowOpenUntilUtc: null }), none)).toEqual({ kind: "windowClosed" });
    expect(composerState(row(), { paymentRequired: false, windowClosed: true })).toEqual({ kind: "windowClosed" });
  });

  it("sin medio de pago lo dice antes que la ventana, desde el número (CC13) o desde el 409", () => {
    expect(composerState(row({ windowOpenUntilUtc: null }), { paymentRequired: true, windowClosed: false })).toEqual({ kind: "paymentRequired" });
    expect(composerState(row({ channel: { id: "n", displayNumber: "+5493515550200", status: "PaymentMissing" } }), none)).toEqual({ kind: "paymentRequired" });
  });
});

describe("encabezado y fila", () => {
  const texts = { untaken: "Sin tomar", linked: "Vinculada a su cuenta", employee: "Empleado" };
  it("sin tomar dice el equipo; si no, lo que se sabe del contacto o quién lo atiende", () => {
    expect(rowDescriptors(row({ assignee: null, assignedToMe: false }), texts)).toEqual(["Sin tomar", "Ventas"]);
    expect(rowDescriptors(row({ linkedToAccount: true, tags: ["Mayorista"] }), texts)).toEqual(["Vinculada a su cuenta", "Mayorista"]);
    expect(rowDescriptors(row({ inbox: "Internal" }), texts)).toEqual(["Empleado"]);
    expect(rowDescriptors(row(), texts)).toEqual(["Ventas", "Lucía Fernández"]);
    expect(rowAssignment(row({ assignee: null, assignedToMe: false }), "Sin tomar")).toBe("Ventas · Sin tomar");
    expect(initialsOf("Martina López")).toBe("ML");
  });
});

describe("plantilla", () => {
  it("la vista previa reemplaza cada variable por lo escrito y deja las vacías como están", () => {
    expect(templatePreview("Hola {{1}}, tu pedido {{2}} está listo.", ["Martina", " "])).toEqual([
      { kind: "text", text: "Hola " }, { kind: "variable", index: 0, text: "Martina" }, { kind: "text", text: ", tu pedido " },
      { kind: "variable", index: 1, text: "{{2}}" }, { kind: "text", text: " está listo." },
    ]);
  });
});

it("«Seguir en WhatsApp» abre wa.me con los dígitos", () => {
  expect(whatsappLink("+54 9 11 5555-0300")).toBe("https://wa.me/5491155550300");
});
