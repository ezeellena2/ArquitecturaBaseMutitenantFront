import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("PublicPagePage", () => {
  it("muestra el bloqueo de moderación, valida la dirección y guarda con la versión actual", async () => {
    let updateBody: unknown;
    const checkedSlugs: string[] = [];
    server.use(
      http.get("/api/organization/public-page", () => HttpResponse.json({
        slug: "grupo-delta", name: "Grupo Delta", description: "Servicios del grupo", logoDataUri: null,
        contactEmail: "contacto@example.test", contactPhone: null, address: null, website: null,
        isPublished: false, publishBlockedAtUtc: "2026-10-02T10:00:00Z", publishBlockedReason: "Datos de contacto falsos", version: 8,
      })),
      http.get("/api/public-site/slug-availability", ({ request }) => {
        const slug = new URL(request.url).searchParams.get("slug") ?? "";
        checkedSlugs.push(slug);
        return HttpResponse.json({ slug, availability: "Available" });
      }),
      http.put("/api/organization/public-page", async ({ request }) => { updateBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );

    const { container } = renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });
    expect(await screen.findByRole("textbox", { name: "Nombre de la página" })).toBeVisible();
    const slug = await screen.findByRole("textbox", { name: "Dirección de la página" });
    expect(screen.getByText("Despublicada por la plataforma")).toBeVisible();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ver el motivo y qué podés hacer" }));
    expect(await screen.findByText("Motivo: Datos de contacto falsos")).toBeVisible();
    await user.keyboard("{Escape}");
    await user.clear(slug);
    await user.type(slug, "grupo-nuevo");
    await waitFor(() => expect(checkedSlugs.at(-1)).toBe("grupo-nuevo"), { timeout: 3_000 });
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toMatchObject({ slug: "grupo-nuevo", version: 8, removeLogo: false }));
  });
});
