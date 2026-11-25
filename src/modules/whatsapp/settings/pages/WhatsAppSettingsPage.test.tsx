import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { MeResponse } from "@/shared/api/types";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { UpdateWhatsAppOrganizationSettingsRequest, WhatsAppOrganizationSettingsResponse } from "../../api/types";
import { mountWhatsApp, whatsappOwner } from "../../test/support";

const path = "/org/whatsapp/configuracion";
const reader: MeResponse = { ...whatsappOwner, permissions: ["settings.read"], effectivePermissions: { platform: [], organization: ["settings.read"], companies: {} } };

function handlers(read: WhatsAppOrganizationSettingsResponse = { chatRetentionDays: 90, maxOrganizationChatRetentionDays: 3650, version: 4 }) {
  const sent: UpdateWhatsAppOrganizationSettingsRequest[] = [];
  let current = read;
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/organization/whatsapp/settings", () => HttpResponse.json(current)),
    http.put("/api/organization/whatsapp/settings", async ({ request }) => {
      const body = await request.json() as UpdateWhatsAppOrganizationSettingsRequest; sent.push(body);
      current = { ...current, chatRetentionDays: body.chatRetentionDays ?? 0, version: current.version + 1 };
      return HttpResponse.json({ version: current.version });
    }),
  );
  return { sent, replace: (next: WhatsAppOrganizationSettingsResponse) => { current = next; } };
}

const field = () => screen.findByRole("textbox", { name: "Guardar los mensajes de los chats" });

beforeAll(async () => { await import("./WhatsAppSettingsPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("Configuración de WhatsApp de la organización (WA-Config-Base2)", () => {
  it("muestra el plazo de los chats con su unidad y su (i), y guarda con la versión", async () => {
    const { sent } = handlers();
    const page = mountWhatsApp(whatsappOwner, path);
    expect(await field()).toHaveValue("90");
    expect(screen.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Chats" })).toBeVisible();
    expect(screen.getByText("días")).toBeVisible();
    expect(await field()).toHaveAccessibleDescription(/De 1 a 3.650 días, y hasta el máximo de la plataforma \(3.650\)\. Pasado el plazo se borra el texto de los mensajes, también lo que recibió el asistente\. La política de privacidad tiene que prometer este mismo plazo\./);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(await axe(page.container)).toHaveNoViolations();

    await page.user.clear(await field());
    await page.user.type(await field(), "180");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(sent).toEqual([{ chatRetentionDays: 180, version: 4 }]));
    expect(await screen.findByText("Se guardó la configuración de WhatsApp.")).toBeVisible();
  });

  it("fuera de rango no manda nada: debajo de 1, y más que el máximo de la plataforma; el 400 del back va debajo del campo", async () => {
    const { sent } = handlers();
    const page = mountWhatsApp(whatsappOwner, path);
    await page.user.clear(await field());
    await page.user.type(await field(), "0");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tiene que ser de 1 a 3.650.")).toBeVisible();
    await page.user.clear(await field());
    await page.user.type(await field(), "4000");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tiene que ser de 1 a 3.650: es el máximo de la plataforma.")).toBeVisible();
    expect(sent).toEqual([]);

    // La plataforma bajó su máximo: el back rechaza el plazo en su campo.
    server.use(http.put("/api/organization/whatsapp/settings", () => HttpResponse.json({ status: 400, code: "Validation.Failed", traceId: "t",
      errors: { chatRetentionDays: ["Usá un número de 1 a 365."] } }, { status: 400 })));
    await page.user.clear(await field());
    await page.user.type(await field(), "900");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Usá un número de 1 a 365.")).toBeVisible();
    expect(await field()).toHaveAttribute("aria-invalid", "true");
  });

  it("un plazo que no es un número dice un solo error debajo del campo, también uno que se lee de dos maneras", async () => {
    const { sent } = handlers();
    const page = mountWhatsApp(whatsappOwner, path);
    for (const text of ["abc", "1.500"]) {
      await page.user.clear(await field());
      await page.user.type(await field(), text);
      await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
      expect(await screen.findByText("Tiene que ser de 1 a 3.650.")).toBeVisible();
      expect(screen.queryByText("Ingresá un número válido.")).not.toBeInTheDocument();
      expect(screen.queryByText(/Se puede leer de dos maneras/)).not.toBeInTheDocument();
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(await field()).toHaveAttribute("aria-invalid", "true");
    }
    expect(sent).toEqual([]);
  });

  it("el máximo es el que fija la plataforma, en la (i) y en el error", async () => {
    const { sent } = handlers({ chatRetentionDays: 90, maxOrganizationChatRetentionDays: 365, version: 4 });
    const page = mountWhatsApp(whatsappOwner, path);
    expect(await field()).toHaveAccessibleDescription(/De 1 a 3.650 días, y hasta el máximo de la plataforma \(365\)\./);
    await page.user.clear(await field());
    await page.user.type(await field(), "400");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tiene que ser de 1 a 365: es el máximo de la plataforma.")).toBeVisible();
    expect(sent).toEqual([]);
  });

  it("el 409 dice que otra persona cambió la configuración y «Revisar valores actuales» trae lo guardado", async () => {
    const { replace } = handlers();
    server.use(http.put("/api/organization/whatsapp/settings", () => HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", traceId: "t" }, { status: 409 })));
    const page = mountWhatsApp(whatsappOwner, path);
    await page.user.clear(await field());
    await page.user.type(await field(), "120");
    await page.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Otra persona cambió la configuración de WhatsApp. Revisá los valores actuales.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Seguir editando" })).toBeNull();
    replace({ chatRetentionDays: 60, maxOrganizationChatRetentionDays: 3650, version: 9 });
    await page.user.click(screen.getByRole("button", { name: "Revisar valores actuales" }));
    await page.user.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
    await waitFor(async () => expect(await field()).toHaveValue("60"));
    expect(screen.queryByText("Otra persona cambió la configuración de WhatsApp. Revisá los valores actuales.")).toBeNull();
  });

  it("solo con settings.read: el campo apagado con su motivo y sin botones", async () => {
    handlers();
    const page = mountWhatsApp(reader, path);
    expect(await field()).toBeDisabled();
    expect(await field()).toHaveAccessibleDescription(/No tenés permiso para cambiar la configuración\./);
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).toBeNull();
    expect(await axe(page.container)).toHaveNoViolations();
  });

  it("en el teléfono: el título y la sección Chats con el campo (M-WA-Config-Base2)", async () => {
    const restore = asPhone();
    try {
      handlers();
      const page = mountWhatsApp(whatsappOwner, path);
      expect(await field()).toHaveValue("90");
      expect(screen.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Chats" })).toBeVisible();
      expect(await axe(page.container)).toHaveNoViolations();
    } finally { restore(); }
  });
});
