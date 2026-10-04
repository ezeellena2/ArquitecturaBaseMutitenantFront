import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const page = {
  slug: "grupo-delta", name: "Grupo Delta", description: "Servicios del grupo", logoDataUri: null,
  contactEmail: "contacto@example.test", contactPhone: null, address: null, website: null,
  isPublished: true, publishBlockedAtUtc: null as string | null, publishBlockedReason: null as string | null, version: 8,
};

function api(current: typeof page, calls: string[] = []) {
  server.use(
    http.get("/api/organization/public-page", () => HttpResponse.json(current)),
    http.post("/api/organization/public-page/publish", async ({ request }) => { calls.push(`publish ${JSON.stringify(await request.json())}`); return new HttpResponse(null, { status: 204 }); }),
    http.post("/api/organization/public-page/unpublish", async ({ request }) => { calls.push(`unpublish ${JSON.stringify(await request.json())}`); return new HttpResponse(null, { status: 204 }); }),
  );
}

function subline() {
  return screen.getByRole("heading", { level: 1, name: "Página pública" }).parentElement!.querySelector("[data-slot='page-subline']")!;
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("PublicPagePage (tablero Pagina-Org)", () => {
  it("publicada: el interruptor de «Publicación» está prendido y apagarlo pide confirmación", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    api(page, calls);
    const { container } = renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const visible = await screen.findByRole("switch", { name: "Visible en grupo-delta.plataforma.com" });
    expect(visible).toBeChecked();
    expect(subline()).toHaveTextContent(/^Publicada$/);
    expect(screen.getByRole("link", { name: "Ver página" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Despublicar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(visible);
    const dialog = await screen.findByRole("dialog", { name: "¿Despublicar la página?" });
    expect(dialog).toHaveTextContent("Deja de verse en grupo-delta.plataforma.com. La podés volver a publicar cuando quieras.");
    await user.click(within(dialog).getByRole("button", { name: "Despublicar" }));
    await waitFor(() => expect(calls).toEqual(["unpublish {\"version\":8}"]));
    expect(await screen.findByText("Despublicamos tu página.")).toBeVisible();
  });

  it("borrador: prender el interruptor publica al momento", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    api({ ...page, isPublished: false }, calls);
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const visible = await screen.findByRole("switch", { name: "Visible en grupo-delta.plataforma.com" });
    expect(visible).not.toBeChecked();
    expect(subline()).toHaveTextContent(/^Borrador$/);
    expect(screen.getByRole("button", { name: "Vista previa" })).toBeVisible();
    await user.click(visible);
    await waitFor(() => expect(calls).toEqual(["publish {\"version\":8}"]));
    expect(await screen.findByText("Publicamos tu página.")).toBeVisible();
  });

  it("despublicada por la plataforma: interruptor trabado y la ⓘ abre el aviso con motivo, fecha y pasos", async () => {
    const user = userEvent.setup();
    api({ ...page, isPublished: false, publishBlockedAtUtc: "2026-09-26T15:00:00Z", publishBlockedReason: "Datos de contacto falsos" });
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    expect(await screen.findByRole("switch", { name: "Visible en grupo-delta.plataforma.com" })).toBeDisabled();
    expect(subline()).toHaveTextContent(/^Despublicada por la plataforma$/);
    await user.click(screen.getByRole("button", { name: "Ver el motivo y qué podés hacer" }));
    const notice = await screen.findByRole("dialog", { name: "Página despublicada" });
    expect(notice).toHaveTextContent("Datos de contacto falsos");
    expect(notice).toHaveTextContent("Despublicada por la plataforma el 26/09/2026");
    expect(notice).toHaveTextContent("Qué podés hacer");
    expect(within(notice).getAllByRole("listitem").map((item) => item.textContent?.replace(/^\d/, ""))).toEqual(["Corregí los datos de la página", "Pedí a la plataforma que la habilite"]);
    await user.click(within(notice).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Página despublicada" })).not.toBeInTheDocument());
  });

  it("el logo va en «Página», el contacto en «Contacto», y guarda con la versión actual", async () => {
    const user = userEvent.setup();
    let updateBody: unknown;
    const checkedSlugs: string[] = [];
    api({ ...page, contactPhone: "+541143215678" as never });
    server.use(
      http.get("/api/public-site/slug-availability", ({ request }) => {
        const slug = new URL(request.url).searchParams.get("slug") ?? "";
        checkedSlugs.push(slug);
        return HttpResponse.json({ slug, availability: "Available" });
      }),
      http.put("/api/organization/public-page", async ({ request }) => { updateBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const pageBox = await screen.findByRole("region", { name: "Página" });
    expect(within(pageBox).getByText("Logo")).toBeVisible();
    // Sin imagen, la inicial de cada palabra, como el tablero («GD»).
    expect(within(pageBox).getByText("GD")).toBeVisible();
    expect(within(pageBox).getByText("Subir imagen")).toBeVisible();
    expect(within(pageBox).getByText(".plataforma.com")).toBeVisible();
    expect(screen.getByRole("region", { name: "Contacto" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Logo" })).not.toBeInTheDocument();

    const slug = within(pageBox).getByRole("textbox", { name: "Dirección de la página" });
    await user.clear(slug);
    await user.type(slug, "grupo-nuevo");
    await waitFor(() => expect(checkedSlugs.at(-1)).toBe("grupo-nuevo"), { timeout: 3_000 });
    // Teléfono como país + número (telefonos.md): el E.164 guardado se edita en formato nacional.
    const phone = within(screen.getByRole("region", { name: "Contacto" })).getByRole("textbox", { name: "Teléfono" });
    expect(phone).toHaveValue("011 4321-5678");
    await user.clear(phone);
    await user.type(phone, "011 4321-5679");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toMatchObject({ slug: "grupo-nuevo", version: 8, removeLogo: false,
      contactPhone: { country: "AR", number: "011 4321-5679" } }));
    expect(await screen.findByText("Guardamos la página.")).toBeVisible();
  });
});
