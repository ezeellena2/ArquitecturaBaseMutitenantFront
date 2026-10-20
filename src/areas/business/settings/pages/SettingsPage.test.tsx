import { domainPage } from "@/test/mocks/domainPage";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { MeResponse } from "@/shared/api/types";
import { businessE6Admin } from "@/test/mocks/currentUsers";

const settings = {
  name: "Grupo Delta", defaultCulture: "es-AR", defaultTimeZoneId: "America/Argentina/Buenos_Aires", defaultCurrency: "ARS", version: 12,
};
const verified = {
  id: "domain-1", domain: "delta.example.test", status: "Verified", txtRecordName: null, txtRecordValue: null,
  createdAtUtc: "2026-10-01T12:00:00Z", verifiedAtUtc: "2026-10-01T12:05:00Z", version: 4,
};
const pending = { ...verified, status: "Pending", txtRecordName: "delta.example.test", txtRecordValue: "ab-verificacion=7f3c9a2e", verifiedAtUtc: null };

// La ruta carga la pantalla con lazyPage: se importa antes de las pruebas para que la primera no pague, dentro de su
// límite, la carga del módulo, que con la máquina cargada la pasaba de 5 s.
beforeAll(async () => { await import("./SettingsPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("SettingsPage", () => {
  it("desde Inicio pagina sólo dominios pendientes y limpiar recupera verificados", async () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ ...pending, id: `pending-${index}`, domain: `pending-${index}.example.test` }));
    const requests: URL[] = [];
    server.use(http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", ({ request }) => {
        const url = new URL(request.url); requests.push(url);
        const filtered = url.searchParams.get("status") === "Pending";
        const items = filtered ? rows : [verified, ...rows];
        const page = Number(url.searchParams.get("page") ?? 1);
        return HttpResponse.json({ items: items.slice((page - 1) * 10, page * 10), page, pageSize: 10, totalCount: items.length,
          totalPages: 2, hasPrevious: page > 1, hasNext: page < 2 });
      }));
    renderRouteWithProviders("/org/configuracion?domainStatus=Pending", { as: "business-e6-admin" });
    await screen.findByText(rows[0].domain);
    expect(requests[0]?.searchParams.get("status")).toBe("Pending");
    expect(screen.queryByText(verified.domain)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText(rows[11].domain)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(await screen.findByText(verified.domain)).toBeVisible();
    expect(requests.at(-1)?.searchParams.get("status")).toBeNull();
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
  });
  it("pagina dominios en el servidor y permite llegar al dominio número 12", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 12 }, (_, index) => ({ ...verified, id: `domain-${index}`, domain: `domain-${index}.example.test` }));
    const requests: URL[] = [];
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", ({ request }) => {
        const url = new URL(request.url); requests.push(url);
        const page = Number(url.searchParams.get("page") ?? 1);
        return HttpResponse.json({ items: rows.slice((page - 1) * 10, page * 10), page, pageSize: 10, totalCount: rows.length, totalPages: 2, hasPrevious: page > 1, hasNext: page < 2 });
      }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    await screen.findByText(rows[0].domain);
    expect(screen.queryByText(rows[11].domain)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(await screen.findByText(rows[11].domain)).toBeVisible();
    expect(requests.map((url) => url.searchParams.get("page"))).toEqual(["1", "2"]);
  });
  it("al guardar otra región relee el país de la organización en el perfil sin cambiar la cultura personal", async () => {
    let current = settings;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(current)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([]))),
      http.put("/api/organization/settings", async ({ request }) => {
        const body = await request.json() as typeof settings;
        current = { ...body, version: body.version + 1 };
        return HttpResponse.json({ version: current.version });
      }),
    );
    const { queryClient, container } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const selector = await screen.findByRole("combobox", { name: "Idioma y región predeterminados" });
    server.use(http.get("/api/me", () => HttpResponse.json({
      ...businessE6Admin, organizationCountryCode: current.defaultCulture === "en-US" ? "US" : "AR",
    })));
    const user = userEvent.setup();
    await user.click(selector);
    await user.click(await screen.findByRole("option", { name: /English \(United States\)/ }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(current.defaultCulture).toBe("en-US"));
    await waitFor(() => expect(queryClient.getQueryData<MeResponse>(currentUserQueryKey)?.organizationCountryCode).toBe("US"));
    expect(queryClient.getQueryData<MeResponse>(currentUserQueryKey)?.culture).toBe("es-AR");
    expect(await axe(container)).toHaveNoViolations();
  });
  // Tablero M-Configuracion: en el teléfono los datos son campos sueltos sobre blanco, sin título; el dominio va en una
  // tarjeta con «Agregar dominio» en texto, y «Descartar cambios» y «Guardar cambios» fijos abajo.
  it("en el teléfono son campos sueltos y el dominio en una tarjeta", async () => {
    const restore = asPhone();
    try {
      server.use(
        http.get("/api/organization/settings", () => HttpResponse.json(settings)),
        http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
      );
      renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

      await screen.findByRole("textbox", { name: "Nombre de la organización" });
      expect(screen.getByRole("heading", { name: "Datos de la organización" })).toHaveClass("sr-only");
      const domains = screen.getByRole("region", { name: "Dominio de correo" });
      expect(within(domains).getByRole("button", { name: "Agregar dominio" })).toHaveClass("text-[var(--marca-tx)]");
      expect((await within(domains).findByText("delta.example.test")).closest("ul")!.parentElement).toHaveClass("rounded-[14px]");
      // Tablero M-Configuracion: «● Verificado · 10 correos administrados por …» sigue en otra línea en lugar de cortarse.
      expect(within(domains).getByText("Verificado").parentElement!.parentElement).toHaveClass("max-md:whitespace-normal");
      expect(screen.getByRole("button", { name: "Guardar cambios" }).parentElement).toHaveAttribute("data-slot", "fixed-actions");
    } finally {
      restore();
    }
  });

  // Tableros Configuracion (.o-dom-vacio) y M-Configuracion-Dominio («Sin dominio» en .ap-it.apag): en la compu, 13 en
  // gris claro con 14 y 16 de relleno; en el teléfono, una fila de la lista de 56, con la letra de 15,5 de sus títulos y
  // apagada.
  it("«Sin dominio» tiene el tamaño del tablero: en el teléfono, una fila apagada de la lista", async () => {
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const empty = await screen.findByText("Sin dominio");
    expect(empty).toHaveClass("px-4", "py-3.5", "text-[13px]", "text-[var(--t3)]");
    expect(empty).toHaveClass("max-md:flex", "max-md:min-h-14", "max-md:items-center", "max-md:py-2", "max-md:pr-3.5", "max-md:pl-4",
      "max-md:text-[15.5px]", "max-md:font-medium", "max-md:text-[var(--t1)]", "max-md:opacity-55");
  });

  // Tablero Configuracion: el dominio verificado dice cuántos correos administra la organización («Verificado · 10 correos
  // administrados por Grupo Delta», con managedEmailCount del back); el pendiente, solo su estado.
  it("el dominio verificado dice cuántos correos administra la organización; el pendiente, solo «Pendiente»", async () => {
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([
        { ...verified, managedEmailCount: 10 },
        { ...verified, id: "domain-2", domain: "delta-norte.example.test", managedEmailCount: 1 },
        { ...pending, id: "domain-3", domain: "delta-sur.example.test", managedEmailCount: 0 },
        { ...verified, id: "domain-4", domain: "delta-oeste.example.test", managedEmailCount: 0 },
      ]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    expect((await screen.findByText("delta.example.test")).closest("li")).toHaveTextContent("Verificado · 10 correos administrados por Empresa A");
    expect(screen.getByText("delta-norte.example.test").closest("li")).toHaveTextContent("Verificado · 1 correo administrado por Empresa A");
    // Configuracion-Quitar (v108, «Ningún correo administrado»): sin correos administrados, «Verificado» va sin la cantidad.
    const unused = screen.getByText("delta-oeste.example.test").closest("li")!;
    expect(unused).toHaveTextContent("Verificado");
    expect(unused).not.toHaveTextContent("administrad");
    const pendingRow = screen.getByText("delta-sur.example.test").closest("li")!;
    expect(pendingRow).toHaveTextContent("Pendiente");
    expect(pendingRow).not.toHaveTextContent("administrad");
  });

  // Tablero «Criterio · Formularios»: lo que no se edita se muestra como texto, nunca como un campo gris.
  // A11 («Criterio · Formularios», v113): sin permiso para cambiar, el mismo campo, apagado; los desplegables con su flechita.
  it("sin permiso para cambiar, muestra cada dato en su campo apagado y sin botones", async () => {
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
    );

    const { container } = renderRouteWithProviders("/org/configuracion", { as: "business-settings-reader" });
    const data = await screen.findByRole("region", { name: "Datos de la organización" });

    await waitFor(() => expect(within(data).getByText("Peso argentino (ARS)")).toBeVisible());
    expect(within(data).getByText("Grupo Delta")).toBeVisible();
    expect(within(data).getByText("Español (Argentina)")).toBeVisible();
    expect(within(data).getByText("Buenos Aires (GMT−3)")).toBeVisible();
    expect(within(data).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(data).queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar dominio" })).not.toBeInTheDocument();
    expect(within(data).getByRole("group", { name: "Nombre de la organización" }).querySelector("[data-slot=read-only-field]")).toHaveClass("bg-[var(--s2)]", "text-[var(--t2)]");
    for (const name of ["Idioma y región predeterminados", "Zona horaria predeterminada", "Moneda predeterminada"]) {
      expect(within(data).getByRole("group", { name }).querySelector("[data-slot=read-only-field] svg")).not.toBeNull();
    }
    expect(await axe(container)).toHaveNoViolations();
  });

  // «Criterio · Avisos» (Pantalla de error): si la configuración no carga, no se puede mostrar nada; «Reintentar» la
  // vuelve a pedir.
  it("si la configuración no carga, dice que no se pudo abrir y «Reintentar» la vuelve a pedir", async () => {
    const user = userEvent.setup();
    let fail = true;
    server.use(
      http.get("/api/organization/settings", () => fail
        ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500 })
        : HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("textbox", { name: "Nombre de la organización" })).toHaveValue("Grupo Delta");
  });

  // Tablero Configuracion: el ícono del título es la rueda (un círculo con ocho rayos), no los deslizadores del menú.
  it("el título lleva la rueda del tablero", async () => {
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const header = (await screen.findByRole("heading", { level: 1, name: "Configuración" })).closest("header")!;
    const icon = header.querySelector("svg")!;
    expect(icon).not.toHaveClass("lucide-sliders-horizontal");
    expect(icon.querySelectorAll("circle")).toHaveLength(1);
    expect(icon.querySelectorAll("path")).toHaveLength(8);
  });

  it("guarda con la versión y la ficha pasa axe", async () => {
    let updateBody: unknown;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
      http.put("/api/organization/settings", async ({ request }) => { updateBody = await request.json(); return HttpResponse.json({ version: 13 }); }),
    );

    const { container } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    expect(screen.getByRole("heading", { name: "Dominio de correo" })).toBeVisible();
    expect(await screen.findByText("delta.example.test")).toBeVisible();
    expect(screen.getByText("Verificado")).toBeVisible();
    // Tablero Configuracion: «Idioma y región predeterminados».
    expect(screen.getByText("Idioma y región predeterminados")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateBody).toEqual({ ...settings, name: "Grupo Delta Sur" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();
  });

  // Tableros Configuracion-Quitar y M-Configuracion-Quitar (v108): el texto dice qué pasa con los correos que ya administra
  // la organización, para 10, para 1 y, sin ninguno, sin esa frase.
  it.each([
    [10, "Los correos nuevos de delta.example.test ya no quedan administrados por Empresa A. Los 10 que ya lo están siguen igual."],
    [1, "Los correos nuevos de delta.example.test ya no quedan administrados por Empresa A. El que ya lo está sigue igual."],
    [0, "Los correos nuevos de delta.example.test ya no quedan administrados por Empresa A."],
  ])("quita un dominio con %i correos administrados, con su versión y el texto del tablero", async (managedEmailCount, text) => {
    let removeUrl: URL | undefined;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([{ ...verified, managedEmailCount }]))),
      http.delete("/api/organization/settings/domains/:domainId", ({ request }) => { removeUrl = new URL(request.url); return new HttpResponse(null, { status: 204 }); }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const user = userEvent.setup();
    (await screen.findByRole("button", { name: "Acciones de delta.example.test" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Quitar" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Quitar delta.example.test?" });
    expect(within(dialog).getByText(/^Los correos nuevos/).textContent).toBe(text);
    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(removeUrl?.searchParams.get("version")).toBe("4"));
  });

  it("agrega un dominio: «Siguiente» abre «Verificar» con el TXT, «Copiar» y «Comprobar»", async () => {
    const user = userEvent.setup();
    let registered: unknown;
    let verifications = 0;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage(registered ? [pending] : []))),
      http.post("/api/organization/settings/domains", async ({ request }) => { registered = await request.json(); return HttpResponse.json(pending, { status: 201 }); }),
      http.post("/api/organization/settings/domains/domain-1/verify", () => {
        verifications += 1;
        return verifications === 1
          ? HttpResponse.json({ status: 422, code: "Settings.TenantDomain.TxtNotFound", title: "No", detail: "No encontramos el registro TXT de verificación en el DNS." }, { status: 422 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    expect(await screen.findByText("Sin dominio")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Agregar dominio" }));
    const add = await screen.findByRole("dialog", { name: "Agregar dominio" });
    // «Criterio · Diálogos»: el cuerpo común de los diálogos, con su margen y la distancia entre campos.
    expect(within(add).getByRole("textbox", { name: "Dominio" }).closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(add).getByRole("textbox", { name: "Dominio" }));
    await user.paste("delta.example.test");
    await user.click(within(add).getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(registered).toEqual({ domain: "delta.example.test" }));

    const verify = await screen.findByRole("dialog", { name: "Verificar delta.example.test" });
    expect(verify).toHaveTextContent("Registro TXT a cargar en el DNS de delta.example.test");
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e")).toBeVisible();
    // Tablero Configuracion-Verificar (.rt y .o-codigo): el rótulo en 12,5 y gris medio; el registro en 13 con la altura
    // normal de su letra, en una caja de radio 8 con 10 arriba y abajo y 12 a los lados.
    expect(within(verify).getByText("Registro TXT a cargar en el DNS de delta.example.test")).toHaveClass("text-[12.5px]", "font-semibold", "text-[var(--t2)]");
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e")).toHaveClass("text-[13px]", "leading-[normal]");
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e").parentElement).toHaveClass("rounded-[8px]", "px-3", "py-2.5");
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e").closest("[data-slot='dialog-body']")).not.toBeNull();
    await user.click(within(verify).getByRole("button", { name: "Copiar" }));
    expect(await navigator.clipboard.readText()).toBe("ab-verificacion=7f3c9a2e");
    expect(within(verify).getByRole("button", { name: "Copiado" })).toBeVisible();

    await user.click(within(verify).getByRole("button", { name: "Comprobar" }));
    expect(await within(verify).findByRole("alert")).toHaveTextContent("No encontramos el registro TXT de verificación en el DNS.");
    await user.click(within(verify).getByRole("button", { name: "Comprobar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Verificar delta.example.test" })).not.toBeInTheDocument());
    expect(await screen.findByText("Verificamos delta.example.test.")).toBeVisible();
  });

  // «Criterio · Botones» y «Criterio · Formularios»: «Siguiente» no se apaga; sin dominio, el campo queda en rojo con
  // «Escribí el dominio.» y se limpia al escribirlo.
  it("«Siguiente» sin dominio marca el campo con «Escribí el dominio.» y se limpia al escribirlo", async () => {
    const user = userEvent.setup();
    let posts = 0;
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([]))),
      http.post("/api/organization/settings/domains", () => { posts += 1; return HttpResponse.json(pending, { status: 201 }); }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    await user.click(await screen.findByRole("button", { name: "Agregar dominio" }));
    const add = await screen.findByRole("dialog", { name: "Agregar dominio" });

    // «Criterio · Formularios»: el dominio es obligatorio y lleva el asterisco rojo, como M-Configuracion-Dominio.
    expect(within(add).getByText("Dominio").closest("label")).toHaveTextContent("Dominio *");
    const next = within(add).getByRole("button", { name: "Siguiente" });
    expect(next).toBeEnabled();
    await user.click(next);
    const domain = within(add).getByRole("textbox", { name: "Dominio" });
    expect(domain).toHaveAttribute("aria-invalid", "true");
    expect(domain).toHaveAccessibleDescription("Escribí el dominio.");
    expect(posts).toBe(0);

    await user.type(domain, "d");
    expect(within(add).queryByText("Escribí el dominio.")).not.toBeInTheDocument();
  });

  // formularios.md (Diálogo): se monta solo mientras está abierto; al cerrarlo, lo escrito y su error se van con él.
  it("«Agregar dominio» se abre vacío cada vez, sin el error de la vez anterior", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([]))),
      http.post("/api/organization/settings/domains", () => HttpResponse.json(
        { status: 409, code: "Settings.TenantDomain.AlreadyRegistered", title: "Conflicto", detail: "Ese dominio ya está registrado." }, { status: 409 })),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const open = await screen.findByRole("button", { name: "Agregar dominio" });
    await user.click(open);
    const first = await screen.findByRole("dialog", { name: "Agregar dominio" });
    await user.type(within(first).getByRole("textbox", { name: "Dominio" }), "delta.example.test");
    await user.click(within(first).getByRole("button", { name: "Siguiente" }));
    expect(await within(first).findByRole("alert")).toHaveTextContent("Ese dominio ya está registrado.");
    await user.click(within(first).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Agregar dominio" })).not.toBeInTheDocument());

    // En jsdom, después de cerrar un diálogo, Radix a veces ignora el clic del puntero: se abre con foco y Enter.
    open.focus();
    await user.keyboard("{Enter}");
    const second = await screen.findByRole("dialog", { name: "Agregar dominio" });
    expect(within(second).getByRole("textbox", { name: "Dominio" })).toHaveValue("");
    expect(within(second).queryByRole("alert")).not.toBeInTheDocument();
  });

  // Tablero M-Configuracion-Verificar: en el teléfono, el rótulo del TXT en 13,5 y gris, el registro en una caja gris de
  // 48 sin borde, con radio 12, y «Copiar» en texto petróleo con su ícono, como las acciones en texto del teléfono.
  it("en el teléfono, «Verificar» lleva el rótulo del TXT y «Copiar» del tablero", async () => {
    const restore = asPhone();
    try {
      const user = userEvent.setup();
      server.use(
        http.get("/api/organization/settings", () => HttpResponse.json(settings)),
        http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([pending]))),
      );
      renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

      await user.click(await screen.findByRole("button", { name: "Verificar" }));
      const verify = await screen.findByRole("dialog", { name: "Verificar delta.example.test" });
      // .ap-cod: el rótulo y el registro con la altura normal de su letra, la caja con radio 12 y el ícono de copiar del
      // tablero (dos hojas chicas).
      expect(within(verify).getByText("Registro TXT a cargar en el DNS de delta.example.test")).toHaveClass("text-[13.5px]", "font-semibold", "text-[var(--t2)]", "leading-[normal]");
      const code = within(verify).getByText("ab-verificacion=7f3c9a2e");
      expect(code).toHaveClass("text-[14px]", "break-all", "leading-[normal]");
      expect(code.parentElement).toHaveClass("min-h-12", "rounded-[12px]", "bg-[var(--s3)]", "pl-3.5", "pr-1.5");
      expect(code.parentElement).not.toHaveClass("border");
      const copy = within(verify).getByRole("button", { name: "Copiar" });
      expect(copy).toHaveClass("h-10", "px-2.5", "text-[15.5px]", "font-semibold", "text-[var(--marca-tx)]");
      expect(copy).not.toHaveAttribute("data-variant", "outline");
      expect(copy.querySelector("svg")).not.toBeNull();
      expect(copy.querySelector("svg rect")).toHaveAttribute("width", "11");
    } finally {
      restore();
    }
  });

  it("en un dominio pendiente, «Verificar» abre el diálogo con el TXT y la fila no lo muestra", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([pending]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    expect(await screen.findByText("delta.example.test")).toBeVisible();
    expect(screen.getByText("Pendiente")).toBeVisible();
    expect(screen.queryByText(/ab-verificacion/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verificar" }));
    const verify = await screen.findByRole("dialog", { name: "Verificar delta.example.test" });
    expect(within(verify).getByText("ab-verificacion=7f3c9a2e")).toBeVisible();
  });
  // Tablero Avisos («Guardado»): después de guardar, el formulario queda limpio, aunque la ficha que se vuelve a leer
  // todavía no traiga lo guardado (como en el arnés de capturas).
  it("después de guardar queda limpio con lo guardado", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
      http.put("/api/organization/settings", () => HttpResponse.json({ version: 13 })),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findAllByText("Guardamos la configuración.")).not.toHaveLength(0);
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
  });

  // B11 (tablero Avisos › «Salir sin guardar»): con el nombre cambiado, la banda dice «Cambios sin guardar» y un enlace
  // del menú pregunta antes de salir; «Seguir editando» se queda con lo escrito.
  it("con cambios, un enlace del menú pregunta «¿Salir sin guardar?»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
    );
    const { router } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    // «Inicio», del menú: la pantalla de destino ya está cargada (las de las demás secciones se cargan al entrar).
    const home = within(screen.getByRole("navigation", { name: "General" })).getByRole("link", { name: "Inicio" });
    await user.click(home);
    const dialog = await screen.findByRole("dialog", { name: "¿Salir sin guardar?" });
    expect(dialog).toHaveTextContent("Se pierde lo que cambiaste acá.");
    expect(router.state.location.pathname).toBe("/org/configuracion");

    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "¿Salir sin guardar?" })).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "Nombre de la organización" })).toHaveValue("Grupo Delta Sur");

    await user.click(home);
    await user.click(within(await screen.findByRole("dialog", { name: "¿Salir sin guardar?" })).getByRole("button", { name: "Salir sin guardar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org"));
  });

  // Tablero Configuracion: con cambios, la segunda línea de la banda dice solo «Cambios sin guardar».
  it("con cambios, la banda dice «Cambios sin guardar»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(settings)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });

    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    const subline = () => screen.getByRole("heading", { level: 1, name: "Configuración" }).parentElement!.querySelector("[data-slot='page-subline']");
    expect(subline()).toBeNull();
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    expect(subline()).toHaveTextContent(/^Cambios sin guardar$/);
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(subline()).toBeNull();
  });

  // concurrencia.md (E7): la relectura de fondo trae la moneda que cambió otra persona, pero la ficha sigue con lo que se
  // empezó a editar; el guardado manda la versión de eso y sale el 409 en vez de volver la moneda atrás.
  it("una relectura de fondo no cambia la versión que manda el guardado: sale el 409 y no pisa lo de la otra persona", async () => {
    const user = userEvent.setup();
    let current = settings;
    const sent: unknown[] = [];
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(current)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
      http.put("/api/organization/settings", async ({ request }) => {
        const body = await request.json() as typeof settings;
        sent.push(body);
        return body.version === current.version ? HttpResponse.json({ version: current.version + 1 })
          : HttpResponse.json({ code: "General.ConcurrencyConflict", title: "Conflicto" }, { status: 409 });
      }),
    );
    const { queryClient } = renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });

    current = { ...settings, defaultCurrency: "USD", version: 13 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["organization-settings"] }));
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(sent).toEqual([{ ...settings, name: "Grupo Delta Sur" }]);
  });

  // concurrencia.md (E7): después de guardar, la base es la versión que respondió el guardado. Si otra persona guardó
  // justo después, la relectura trae su cambio con otra versión: no pasa a ser la base y el próximo guardado da 409.
  it("después de guardar, el próximo guardado manda la versión que respondió el guardado, no la de la relectura", async () => {
    const user = userEvent.setup();
    let current = settings;
    const sent: Array<{ version: number }> = [];
    server.use(
      http.get("/api/organization/settings", () => HttpResponse.json(current)),
      http.get("/api/organization/settings/domains/paged", () => HttpResponse.json(domainPage([verified]))),
      http.put("/api/organization/settings", async ({ request }) => {
        const body = await request.json() as typeof settings;
        sent.push(body);
        if (body.version !== current.version) return HttpResponse.json({ code: "General.ConcurrencyConflict", title: "Conflicto" }, { status: 409 });
        // Otra persona guarda justo después: la relectura ya trae su cambio, con otra versión.
        current = { ...current, name: body.name, defaultCurrency: "USD", version: current.version + 2 };
        return HttpResponse.json({ version: settings.version + 1 });
      }),
    );
    renderRouteWithProviders("/org/configuracion", { as: "business-e6-admin" });
    const name = await screen.findByRole("textbox", { name: "Nombre de la organización" });
    await user.clear(name);
    await user.paste("Grupo Delta Sur");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Guardamos la configuración.")).toBeVisible();

    await user.type(name, " Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(sent.map((body) => body.version)).toEqual([12, 13]);
  });
});
