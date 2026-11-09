import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { WhatsAppPhoneImportPreviewResponse } from "../../api/types";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";

const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
const preview: WhatsAppPhoneImportPreviewResponse = {
  rows: [
    { row: 1, phone: "+5491155554521", memberName: "Tomás Acosta", outcome: "AlreadyMember" },
    { row: 2, phone: "+5491155558812", outcome: "Invite" },
    { row: 3, phone: null, outcome: "Invalid" },
  ],
  alreadyMembers: 1, invites: 1, invalid: 1,
};
const path = "/org/usuarios/cargar-telefonos";

beforeAll(async () => { await import("./LoadPhonesPage"); });
beforeEach(() => {
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/companies/paged", () => HttpResponse.json(page([]))),
  );
});
afterEach(() => vi.unstubAllGlobals());

async function review(user: ReturnType<typeof mountWhatsApp>["user"]) {
  const bodies: unknown[] = [];
  server.use(http.post("/api/organization/whatsapp/phone-imports/preview", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json(preview); }));
  await user.click(await screen.findByRole("textbox", { name: "Uno por renglón, hasta 200" }));
  await user.paste("11 5555-4521\n+54 9 11 5555-8812\n11 4444");
  await user.click(screen.getAllByRole("button", { name: "Revisar 3 teléfonos" })[0]);
  return bodies;
}

describe("Cargar teléfonos", () => {
  it("revisa cada teléfono con su país y muestra solo los tres resultados del back, sin decir si hay cuenta", async () => {
    const { user, container } = mountWhatsApp(whatsappOwner, path);
    expect(await screen.findByRole("heading", { name: "Cargar teléfonos de empleados" })).toBeVisible();
    expect(screen.getByText("Paso 1 de 2")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Revisar teléfonos" }));
    expect(await screen.findByText("Pegá o subí al menos un teléfono.")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    const bodies = await review(user);
    expect(await screen.findByText("3 teléfonos · 1 ya es miembro · 1 invitación · 1 inválido")).toBeVisible();
    expect(bodies).toEqual([{ phones: [{ country: "AR", number: "11 5555-4521" }, { country: "AR", number: "011 15-5555-8812" }, { country: "AR", number: "11 4444" }], companyId: null, roleIds: [] }]);
    expect(screen.getByText("Ya es miembro")).toBeVisible();
    expect(screen.getByText("Tomás Acosta")).toBeVisible();
    expect(screen.getByText("Se invita")).toBeVisible();
    // Tablero WA-Telefonos (base de la 12): qué va a pasar, en una palabra con su punto, sin otra línea.
    expect(screen.queryByText("Le llega una invitación por WhatsApp")).not.toBeInTheDocument();
    expect(screen.getByText("Número inválido")).toBeVisible();
    expect(screen.getByText("11 4444")).toBeVisible();
    expect(container).not.toHaveTextContent(/cuenta/i);
    expect(screen.getByRole("button", { name: "Vincular y mandar 1 invitación" })).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("si WhatsApp no puede invitar (503) lo dice en la franja, y el reintento va con la misma clave", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post("/api/organization/whatsapp/phone-imports", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return HttpResponse.json({ code: "Invitations.Invitation.ChannelUnavailable", detail: "WhatsApp no está disponible para invitar." }, { status: 503 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, path);
    await review(user);
    await user.click(await screen.findByRole("checkbox", { name: "La persona aceptó recibir mensajes por WhatsApp" }));
    await user.click(screen.getByRole("button", { name: "Vincular y mandar 1 invitación" }));
    expect(await screen.findByText("WhatsApp no está disponible para invitar.")).toBeVisible();
    expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vincular y mandar 1 invitación" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
  });

  // Decisión 179 (tableros WA-Telefonos y M-WA-Telefonos): para invitar, quien carga confirma el consentimiento.
  it("sin la casilla, «Vincular y mandar» marca el campo y no manda nada; con ella, manda la confirmación", async () => {
    const bodies: unknown[] = [];
    server.use(http.post("/api/organization/whatsapp/phone-imports", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ linked: 1, invited: 1, rows: [] });
    }));
    const { user, container } = mountWhatsApp(whatsappOwner, path);
    expect(await screen.findByRole("heading", { name: "Cargar teléfonos de empleados" })).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: "La persona aceptó recibir mensajes por WhatsApp" })).not.toBeInTheDocument();
    const previews = await review(user);
    const consent = await screen.findByRole("checkbox", { name: "La persona aceptó recibir mensajes por WhatsApp" });
    expect(consent).not.toBeChecked();
    const send = screen.getByRole("button", { name: "Vincular y mandar 1 invitación" });
    expect(send).toBeEnabled();
    await user.click(send);
    expect(await screen.findByText("Confirmá que la persona aceptó recibir mensajes por WhatsApp.")).toBeVisible();
    expect(consent).toHaveAttribute("aria-invalid", "true");
    expect(bodies).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(consent);
    expect(screen.queryByText("Confirmá que la persona aceptó recibir mensajes por WhatsApp.")).not.toBeInTheDocument();
    await user.click(send);
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ phones: [{ country: "AR", number: "11 5555-4521" }, { country: "AR", number: "011 15-5555-8812" }, { country: "AR", number: "11 4444" }], companyId: null, roleIds: [], consentConfirmed: true });
    // La vista previa no lo pide.
    expect(previews[0]).not.toHaveProperty("consentConfirmed");
  });

  it("si el back pide la confirmación (400 ConsentRequired), la marca en la casilla y no en la franja", async () => {
    server.use(http.post("/api/organization/whatsapp/phone-imports", () => HttpResponse.json(
      { code: "WhatsApp.PhoneImport.ConsentRequired", detail: "Confirmá que la persona aceptó recibir mensajes por WhatsApp.", errors: { consentConfirmed: ["Confirmá que la persona aceptó recibir mensajes por WhatsApp."] } },
      { status: 400 })));
    const { user } = mountWhatsApp(whatsappOwner, path);
    await review(user);
    const consent = await screen.findByRole("checkbox", { name: "La persona aceptó recibir mensajes por WhatsApp" });
    await user.click(consent);
    await user.click(screen.getByRole("button", { name: "Vincular y mandar 1 invitación" }));
    expect(await screen.findByText("Confirmá que la persona aceptó recibir mensajes por WhatsApp.")).toBeVisible();
    expect(consent).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Confirmá que la persona aceptó recibir mensajes por WhatsApp.")).toHaveLength(1);
  });

  it("pide «Invitar usuarios» y el módulo prendido", async () => {
    const first = mountWhatsApp(whatsappMember("whatsapp.manage"), path);
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    first.unmount();
    mountWhatsApp({ ...whatsappOwner, features: [] }, path);
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
  });

  it("en el teléfono la acción va fija abajo y cada teléfono es una fila con lo que va a pasar", async () => {
    asPhone();
    const { user, container } = mountWhatsApp(whatsappOwner, path);
    expect(await screen.findByRole("heading", { name: "Cargar teléfonos" })).toBeVisible();
    await review(user);
    expect(await screen.findByText("3 teléfonos · 1 invitación")).toBeVisible();
    const list = screen.getByRole("list");
    expect(within(list).getByText("Tomás Acosta")).toBeVisible();
    expect(within(list).getByText("Número inválido")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
