import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

const page = {
  slug: "grupo-delta", name: "Grupo Delta", description: "Servicios del grupo", logoDataUri: null,
  contactEmail: "contacto@example.test", contactPhone: null as string | null, address: null as string | null, website: null as string | null,
  isPublished: true, publishBlockedAtUtc: null as string | null, publishBlockedReason: null as string | null, version: 8,
};

function api(current: typeof page, calls: string[] = []) {
  server.use(
    http.get("/api/organization/public-page", () => HttpResponse.json(current)),
    http.post("/api/organization/public-page/publish", async ({ request }) => { calls.push(`publish ${JSON.stringify(await request.json())}`); return new HttpResponse(null, { status: 204 }); }),
    http.post("/api/organization/public-page/unpublish", async ({ request }) => { calls.push(`unpublish ${JSON.stringify(await request.json())}`); return new HttpResponse(null, { status: 204 }); }),
  );
}

// Como el back (concurrencia.md): guarda y publica solo con la versión vigente, si no responde 409, y cada escritura
// sube la versión. `current` es lo que tiene el servidor: la prueba lo cambia para simular a otra persona.
function versionedApi(initial: typeof page) {
  const backend = { current: initial, writes: [] as Array<{ version: number }> };
  const conflict = () => HttpResponse.json({ code: "General.ConcurrencyConflict", title: "Conflicto" },
    { status: 409, headers: { "Content-Type": "application/problem+json" } });
  server.use(
    http.get("/api/organization/public-page", () => HttpResponse.json(backend.current)),
    http.put("/api/organization/public-page", async ({ request }) => {
      const body = await request.json() as { version: number; name: string };
      backend.writes.push(body);
      if (body.version !== backend.current.version) return conflict();
      backend.current = { ...backend.current, name: body.name, version: backend.current.version + 1 };
      return new HttpResponse(null, { status: 204 });
    }),
    http.post("/api/organization/public-page/publish", async ({ request }) => {
      const body = await request.json() as { version: number };
      backend.writes.push(body);
      if (body.version !== backend.current.version) return conflict();
      backend.current = { ...backend.current, isPublished: true, version: backend.current.version + 1 };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return backend;
}

function subline() {
  return screen.getByRole("heading", { level: 1, name: "Página pública" }).parentElement!.querySelector("[data-slot='page-subline']")!;
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("PublicPagePage (tablero Pagina-Org)", () => {
  // Tablero M-Pagina-Org: en el teléfono, grupos con el título gris y tarjetas blancas sobre gris; «Ver página» en
  // texto en la barra, el estado debajo del título y «Descartar cambios» y «Guardar cambios» fijos abajo.
  it("en el teléfono son grupos sobre gris, con «Ver página» en la barra", async () => {
    const restore = asPhone();
    try {
      api(page);
      renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

      await screen.findByRole("switch", { name: "Visible en grupo-delta.plataforma.com" });
      const bar = screen.getByRole("heading", { level: 1, name: "Página pública" }).closest("header")!;
      expect(bar).toHaveTextContent("Publicada");
      expect(within(bar).getByRole("link", { name: "Ver página" })).toHaveClass("text-[15.5px]", "text-[var(--marca-tx)]");
      expect(screen.getByRole("heading", { level: 2, name: "Publicación" })).toHaveClass("text-[13.5px]");
      expect(screen.getByRole("switch")).toHaveClass("max-md:data-[size=default]:w-[50px]");
      const fixed = screen.getByRole("button", { name: "Guardar cambios" }).parentElement!;
      expect(fixed).toHaveAttribute("data-slot", "fixed-actions");
      expect(within(fixed).getByRole("button", { name: "Descartar cambios" })).toBeVisible();
      expect(within(fixed).queryByRole("link", { name: "Ver página" })).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

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

  // «Criterio · Avisos» (Pantalla de error): si la página no carga, no se puede mostrar nada; «Reintentar» la vuelve a pedir.
  it("si la página no carga, dice que no se pudo abrir y «Reintentar» la vuelve a pedir", async () => {
    const user = userEvent.setup();
    let fail = true;
    server.use(http.get("/api/organization/public-page", () => fail
      ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500 })
      : HttpResponse.json(page)));
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("textbox", { name: "Nombre de la página" })).toHaveValue("Grupo Delta");
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

  // Tablero Pagina-Org («Borrador: vista previa», v107): «Vista previa» abre el diálogo de 640 con la tarjeta de la
  // página pública sobre su fondo. La tarjeta lleva solo lo que la organización cargó (acá, sin sitio web), lo que está
  // escrito aunque no esté guardado, e «Ingresá para continuar» sin acción. «Cerrar», el principal, la cierra.
  it("borrador: «Vista previa» muestra la tarjeta con los datos cargados y «Cerrar» la cierra", async () => {
    const user = userEvent.setup();
    api({ ...page, isPublished: false, contactPhone: "+541143215678", address: "Av. Corrientes 1234, piso 5, Buenos Aires" });
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const description = await screen.findByRole("textbox", { name: "Descripción" });
    await user.clear(description);
    await user.type(description, "Grupo Delta y sus empresas, en un solo lugar.");
    await user.click(screen.getByRole("button", { name: "Vista previa" }));
    const preview = await screen.findByRole("dialog", { name: "Vista previa" });
    expect(preview).toHaveClass("md:max-w-[640px]");
    expect(await within(preview).findByText("011 4321-5678")).toBeVisible();
    expect(within(preview).getByRole("heading", { level: 1, name: "Grupo Delta" })).toBeVisible();
    expect(within(preview).getByText("Grupo Delta y sus empresas, en un solo lugar.")).toBeVisible();
    expect(within(preview).getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      "DirecciónAv. Corrientes 1234, piso 5, Buenos Aires", "Teléfono011 4321-5678", "Correocontacto@example.test",
    ]);
    expect(within(preview).getByText("Ingresá para continuar")).toBeVisible();
    expect(within(preview).queryByRole("link")).not.toBeInTheDocument();
    expect(await axe(preview)).toHaveNoViolations();

    const close = within(preview.querySelector<HTMLElement>("[data-slot='dialog-footer']")!).getByRole("button", { name: "Cerrar" });
    expect(close).not.toHaveClass("border-[var(--borde2)]");
    await user.click(close);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // Tablero M-Pagina-Org («Borrador: vista previa», v107): en el teléfono, «Vista previa» va en la barra y abre la hoja
  // desde abajo, con la tarjeta de M-Pagina-Publica y «Cerrar» a lo ancho.
  it("en el teléfono, «Vista previa» abre la hoja desde abajo con la tarjeta y «Cerrar»", async () => {
    const restore = asPhone();
    try {
      const user = userEvent.setup();
      api({ ...page, isPublished: false });
      renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

      await screen.findByRole("switch", { name: "Visible en grupo-delta.plataforma.com" });
      const bar = screen.getByRole("heading", { level: 1, name: "Página pública" }).closest("header")!;
      await user.click(within(bar).getByRole("button", { name: "Vista previa" }));
      const sheet = await screen.findByRole("dialog", { name: "Vista previa" });
      expect(sheet).toHaveClass("bottom-0", "rounded-t-[20px]");
      expect(within(sheet).getByRole("heading", { level: 1, name: "Grupo Delta" })).toHaveClass("max-md:text-[26px]");
      expect(within(sheet).getAllByRole("listitem").map((row) => row.textContent)).toEqual(["Correocontacto@example.test"]);
      const footer = sheet.querySelector<HTMLElement>("[data-slot='dialog-footer']")!;
      expect(footer).toHaveClass("max-md:[&_button]:flex-1");
      const close = within(footer).getByRole("button", { name: "Cerrar" });
      expect(await axe(sheet)).toHaveNoViolations();
      await user.click(close);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    } finally {
      restore();
    }
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
    // Como el tablero: el motivo en bordó y negrita; los números de los pasos en un círculo gris relleno.
    expect(within(notice).getByText("Datos de contacto falsos")).toHaveClass("font-semibold");
    expect(within(notice).getByText("Datos de contacto falsos").closest("[class*='peligro-tx']")).not.toBeNull();
    for (const number of notice.querySelectorAll("[data-step-number]")) expect(number).toHaveClass("bg-[var(--s3)]");
    expect(notice).toHaveTextContent("Despublicada por la plataforma el 26/09/2026");
    expect(notice).toHaveTextContent("Qué podés hacer");
    expect(within(notice).getAllByRole("listitem").map((item) => item.textContent?.replace(/^\d/, ""))).toEqual(["Corregí los datos de la página", "Pedí a la plataforma que la habilite"]);
    await user.click(within(notice).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Página despublicada" })).not.toBeInTheDocument());
  });

  // Paquete 2: Página pública también avisa con el cartel de concurrencia, debajo de la banda, y no con un aviso
  // que se va solo.
  it("si otra persona cambió la página, muestra el cartel y conserva lo escrito", async () => {
    const user = userEvent.setup();
    api(page);
    server.use(http.put("/api/organization/public-page", () => HttpResponse.json(
      { code: "General.ConcurrencyConflict", title: "Conflicto" }, { status: 409, headers: { "Content-Type": "application/problem+json" } })));
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const name = await within(await screen.findByRole("region", { name: "Página" })).findByRole("textbox", { name: "Nombre de la página" });
    await user.clear(name);
    await user.type(name, "Grupo Delta Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(name).toHaveValue("Grupo Delta Norte");
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });

  // Tableros Pagina-Org y Avisos: con cambios, la banda dice «Publicada · Cambios sin guardar» y un enlace del menú
  // pregunta «¿Salir sin guardar?».
  it("con cambios, la banda suma «Cambios sin guardar» y salir pregunta antes", async () => {
    const user = userEvent.setup();
    api(page);
    const { router } = renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const name = await within(await screen.findByRole("region", { name: "Página" })).findByRole("textbox", { name: "Nombre de la página" });
    expect(subline()).toHaveTextContent(/^Publicada$/);
    await user.clear(name);
    await user.type(name, "Grupo Delta Norte");
    expect(subline()).toHaveTextContent(/^Publicada · Cambios sin guardar$/);

    await user.click(screen.getByRole("link", { name: "Empresas" }));
    expect(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/org/pagina");
  });

  // «Criterio · Avisos y errores»: el error de un formulario va en su franja, no en un aviso abajo.
  it("un error al guardar va en la franja del formulario, no en un aviso", async () => {
    const user = userEvent.setup();
    api(page);
    server.use(http.put("/api/organization/public-page", () => HttpResponse.json(
      { code: "Tenancy.TenantSlug.Taken", title: "Conflicto", detail: "Esta dirección ya está en uso." },
      { status: 409, headers: { "Content-Type": "application/problem+json" } })));
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });

    const name = await within(await screen.findByRole("region", { name: "Página" })).findByRole("textbox", { name: "Nombre de la página" });
    await user.clear(name);
    await user.type(name, "Grupo Delta Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const message = await screen.findByText("Esta dirección ya está en uso.");
    expect(message.closest("[role='alert']")).not.toBeNull();
    expect(message.closest("[data-sonner-toast]")).toBeNull();
    expect(screen.getAllByText("Esta dirección ya está en uso.")).toHaveLength(1);
    expect(name).toHaveValue("Grupo Delta Norte");
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
    // Tablero Pagina-Org: la caja de «Descripción» crece con el texto y no tiene el tirador para cambiarle el tamaño.
    const description = within(pageBox).getByRole("textbox", { name: "Descripción" });
    expect(description).toHaveClass("resize-none");
    expect(description).not.toHaveClass("resize-y");

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

  // concurrencia.md (E7): la relectura de fondo trae la descripción que cambió otra persona, pero la ficha sigue con lo
  // que se empezó a editar; el guardado manda la versión de eso y sale el 409 en vez de volver la descripción atrás.
  it("una relectura de fondo no cambia la versión que manda el guardado: sale el 409 y no pisa lo de la otra persona", async () => {
    const user = userEvent.setup();
    const backend = versionedApi(page);
    const { queryClient } = renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });
    const name = await within(await screen.findByRole("region", { name: "Página" })).findByRole("textbox", { name: "Nombre de la página" });

    backend.current = { ...page, description: "Lo cambió otra persona.", version: 9 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["organization-public-page"] }));
    await user.clear(name);
    await user.type(name, "Grupo Delta Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(backend.writes).toEqual([expect.objectContaining({ name: "Grupo Delta Norte", description: "Servicios del grupo", version: 8 })]);
  });

  // Publicar se aplica al momento y parte de lo que se está editando: su relectura pasa a ser la base, lo escrito se
  // conserva y «Guardar cambios» no choca con la escritura propia.
  it("publicar con cambios sin guardar no hace chocar después a «Guardar cambios»", async () => {
    const user = userEvent.setup();
    const backend = versionedApi({ ...page, isPublished: false });
    renderRouteWithProviders("/org/pagina", { as: "business-e6-admin" });
    const name = await within(await screen.findByRole("region", { name: "Página" })).findByRole("textbox", { name: "Nombre de la página" });
    await user.clear(name);
    await user.type(name, "Grupo Delta Norte");

    await user.click(screen.getByRole("switch", { name: "Visible en grupo-delta.plataforma.com" }));
    expect(await screen.findByText("Publicamos tu página.")).toBeVisible();
    await waitFor(() => expect(subline()).toHaveTextContent(/^Publicada · Cambios sin guardar$/));
    expect(name).toHaveValue("Grupo Delta Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Guardamos la página.")).toBeVisible();
    expect(backend.writes.map((write) => write.version)).toEqual([8, 9]);
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });
});
