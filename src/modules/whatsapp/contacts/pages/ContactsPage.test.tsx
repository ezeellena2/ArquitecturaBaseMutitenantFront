import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";
import { carla, frameHandlers, martina, paged, unnamed, useNativeForms } from "../test/fixtures";

beforeAll(async () => { await import("./ContactsPage"); await import("./ContactPage"); });
beforeEach(() => frameHandlers());
afterEach(() => vi.unstubAllGlobals());

const list = (items = [martina, unnamed, carla]) => ({ contacts: paged(items, 486), total: 486, accepting: 312 });

describe("Contactos", () => {
  it("muestra el resumen y lleva la búsqueda, la etiqueta y el consentimiento a la URL y a la consulta", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/contacts", ({ request }) => { requests.push(new URL(request.url)); return HttpResponse.json(list()); }));
    const { container, router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos");

    expect(await screen.findByRole("heading", { level: 1, name: "Contactos" })).toBeVisible();
    expect(await screen.findByText("486 contactos")).toBeVisible();
    expect(screen.getByText("312 aceptan promociones")).toBeVisible();
    expect(screen.getByRole("link", { name: "Martina López" })).toHaveAttribute("href", "/org/whatsapp/contactos/contact-martina");
    // Sin nombre, el número es el título; el consentimiento dice de dónde salió.
    expect(screen.getByRole("link", { name: "0351 15-555-0192" })).toBeVisible();
    expect(screen.getByText("Se dio de baja")).toBeVisible();
    expect(screen.getByText(/Por el bot/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Promociones: todas" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Acepta" }));
    await waitFor(() => expect(router.state.location.search).toContain("consent=Accepted"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("consent")).toBe("Accepted"));

    await user.click(screen.getByRole("button", { name: "Etiqueta: todas" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Mayorista" }));
    await waitFor(() => expect(router.state.location.search).toContain("tag=Mayorista"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("tag")).toBe("Mayorista"));
    expect(requests.at(-1)?.searchParams.get("consent")).toBe("Accepted");
    expect(requests.at(-1)?.searchParams.has("sort")).toBe(false);
  });

  it("sin «Atender clientes» no se ve, y con el módulo apagado no existe", async () => {
    const contacts = vi.fn(() => HttpResponse.json(list()));
    server.use(http.get("/api/organization/whatsapp/contacts", contacts));
    const view = mountWhatsApp(whatsappMember("whatsapp.broadcasts"), "/org/whatsapp/contactos");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    view.unmount();

    mountWhatsApp({ ...whatsappOwner, features: [] }, "/org/whatsapp/contactos");
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(contacts).not.toHaveBeenCalled();
  });

  it("a 390 px es la lista de la app con «Importar» en la barra", async () => {
    asPhone();
    server.use(http.get("/api/organization/whatsapp/contacts", () => HttpResponse.json(list())));
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos");
    const row = await screen.findByRole("link", { name: /Martina López/ });
    expect(row).toHaveAttribute("href", "/org/whatsapp/contactos/contact-martina");
    expect(within(row).getByText(/Vinculado/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Filtros" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Importar" }));
    expect(await screen.findByRole("dialog", { name: "Importar contactos" })).toBeVisible();
  });
});

describe("Importar contactos", () => {
  const file = () => new File(["Nombre,Teléfono"], "clientes-mayoristas.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  it("muestra la vista previa con las filas que no entran y reintenta la importación con la misma clave", async () => {
    await useNativeForms();
    const keys: (string | null)[] = [];
    const sentTags: (string | null)[] = [];
    let attempts = 0;
    server.use(
      http.get("/api/organization/whatsapp/contacts", () => HttpResponse.json(list())),
      http.post("/api/organization/whatsapp/contacts/import/preview", () => HttpResponse.json({ rows: 48, new: 41, updated: 7,
        rejected: paged([{ row: 12, reason: "«11 5555» no es un teléfono" }, { row: 27, reason: "Falta el teléfono" }, { row: 33, reason: "El teléfono está repetido en el archivo" }]) })),
      http.post("/api/organization/whatsapp/contacts/import", async ({ request }) => {
        keys.push(request.headers.get("Idempotency-Key"));
        sentTags.push((await request.formData()).get("tag") as string | null);
        attempts++;
        return attempts === 1 ? HttpResponse.error() : HttpResponse.json({ imported: 48, updated: 7, rejected: paged([]) });
      }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos");
    await user.click(await screen.findByRole("button", { name: "Importar contactos" }));
    const dialog = await screen.findByRole("dialog", { name: "Importar contactos" });
    await user.upload(within(dialog).getByLabelText(/Archivo/), file());

    expect(await within(dialog).findByText("48 contactos: 41 nuevos y 7 que ya estaban")).toBeVisible();
    expect(within(dialog).getByText("3 filas")).toBeVisible();
    expect(within(dialog).getByText("Fila 27")).toBeVisible();
    expect(within(dialog).getByText("Falta el teléfono")).toBeVisible();
    expect(await axe(dialog)).toHaveNoViolations();

    await user.click(within(dialog).getByRole("combobox", { name: /Etiqueta para todos/ }));
    await user.click(await screen.findByRole("option", { name: "Mayorista" }));
    await user.click(within(dialog).getByRole("button", { name: "Importar 48 contactos" }));
    // Sin conexión: el aviso común ofrece «Reintentar», que repite el envío con la misma clave (el aviso queda fuera del
    // diálogo, que bloquea el puntero en el resto de la página).
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Importamos 48 contactos.")).toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(sentTags).toEqual(["Mayorista", "Mayorista"]);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Importar contactos" })).not.toBeInTheDocument());
  });

  it("un archivo que no sirve queda en su campo", async () => {
    await useNativeForms();
    server.use(
      http.get("/api/organization/whatsapp/contacts", () => HttpResponse.json(list())),
      http.post("/api/organization/whatsapp/contacts/import/preview", () => HttpResponse.json(
        { status: 400, code: "WhatsApp.Import.InvalidFile", detail: "El archivo tiene que ser un .xlsx o un .csv como el ejemplo." }, { status: 400 })),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos");
    await user.click(await screen.findByRole("button", { name: "Importar contactos" }));
    const dialog = await screen.findByRole("dialog", { name: "Importar contactos" });
    const input = within(dialog).getByLabelText(/Archivo/);
    await user.upload(input, new File(["x"], "fotos.xlsx"));
    expect(await within(dialog).findByText("El archivo tiene que ser un .xlsx o un .csv como el ejemplo.")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByRole("button", { name: "Importar contactos" })).toBeEnabled();
  });
});
