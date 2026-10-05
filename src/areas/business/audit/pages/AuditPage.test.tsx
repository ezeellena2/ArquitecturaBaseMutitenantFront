import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

// Como las demás pruebas de menús de la app: el desplegable se abre con el teclado (foco y Enter).
async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  screen.getByRole("button", { name }).focus();
  await user.keyboard("{Enter}");
}

describe("AuditPage", () => {
  it("con filtros y sin resultados: «Nada coincide con los filtros» y «Limpiar filtros»", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/organization/audit", () => HttpResponse.json({ items: [], nextCursor: null, hasMore: false })),
      http.get("/api/organization/audit/actors", () => HttpResponse.json([])),
    );
    const { router } = renderRouteWithProviders("/org/auditoria?category=roles", { as: "business-e6-admin" });
    expect(await screen.findByText("Nada coincide con los filtros")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(router.state.location.search).not.toContain("category="));
  });


  it("consulta el cursor, muestra el movimiento y abre sus cambios", async () => {
    const requestUrls: URL[] = [];
    server.use(
      http.get("/api/organization/audit", ({ request }) => {
        requestUrls.push(new URL(request.url));
        return HttpResponse.json({ items: [{
          id: "audit-1", occurredAtUtc: "2026-10-02T12:00:00Z", action: "MemberEnabled",
          actionText: "Cambió los roles de Tomás Acosta", entityType: "Member", entityText: "Usuario",
          affectedDisplayName: "Tomás Acosta", whereText: "Delta S.A.",
          actorKind: "User", actorText: "Persona", actorId: "actor-1", actorDisplayName: "Lucía", actorEmail: "lucia@example.com",
          // Como lo arma el back (tanda 4g) y lo muestra el tablero Auditoria-Org (v107): por nombre, sin ids.
          changes: [{ field: "Roles en la empresa", oldValue: "Sin roles", newValue: "Solo lectura" }],
        }], nextCursor: null, hasMore: false });
      }),
      http.get("/api/organization/audit/actors", () => HttpResponse.json([
        { actorId: "actor-1", actorKind: "User", actorText: "Persona", displayName: "Lucía" },
      ])),
    );

    const { container } = renderRouteWithProviders("/org/auditoria", { as: "business-e6-admin" });

    expect(await screen.findByText("Cambió los roles de Tomás Acosta")).toBeVisible();
    expect(screen.getByText("Delta S.A.")).toBeVisible();
    // Tablero Auditoria-Org: banda sin bajada, «Fecha y hora», filtros «Tema: todos» y «Quién: todos», sin el ojo.
    const heading = screen.getByRole("heading", { level: 1, name: "Auditoría" });
    expect(heading.parentElement!.querySelector("[data-slot='page-subline']")).toBeNull();
    // Columnas del tablero: 140px, 2.4fr, 1.4fr y 1.2fr, más los márgenes de cada celda.
    expect(screen.getByRole("columnheader", { name: "Fecha y hora" })).toHaveClass("w-[162px]");
    expect(screen.getByRole("columnheader", { name: "Fecha y hora" })).not.toHaveClass("text-right");
    expect(screen.getByRole("columnheader", { name: "Dónde" })).toHaveClass("w-[23%]");
    expect(screen.getByRole("columnheader", { name: "Quién" })).toHaveClass("w-[20%]");
    expect(screen.getByRole("searchbox", { name: "Buscar en la auditoría" })).toBeVisible();
    // Tableros de listas (.pagina, compacto): 14 entre la caja de los filtros y la tabla.
    expect(screen.getByRole("search").parentElement).toHaveClass("md:gap-3.5");
    expect(screen.getByRole("button", { name: "Tema: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Quién: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver el detalle de Cambió los roles de Tomás Acosta" }).querySelector("svg")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
    expect(requestUrls[0]?.searchParams.get("period")).toBe("30");
    expect(requestUrls[0]?.searchParams.get("limit")).toBe("25");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ver el detalle de Cambió los roles de Tomás Acosta" }));
    // Detalle: Quién (nombre · correo), Dónde, «antes → después» y «Cerrar»; la fecha no se repite bajo el título.
    const detail = await screen.findByRole("dialog", { name: "Cambió los roles de Tomás Acosta" });
    // «Criterio · Diálogos»: uno de los dos anchos de la pieza, el normal de 560 (Auditoria-Org).
    expect(detail).toHaveClass("md:max-w-[560px]");
    expect(detail).not.toHaveClass("md:max-w-[640px]");
    expect(detail).not.toHaveTextContent("02/10/2026");
    expect(detail).toHaveTextContent("QuiénLucía · lucia@example.com");
    expect(detail).toHaveTextContent("DóndeDelta S.A.");
    expect(detail).toHaveTextContent("Roles en la empresaSin roles → Solo lectura");
    expect(within(detail).getByText("Sin roles")).toHaveClass("line-through");
    await user.click(within(detail).getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // Por cursor (paginado-y-listados.md, `useCursorList`): la primera tanda va sin cursor; «Cargar más» pide la siguiente
  // con el cursor opaco del back y con los mismos filtros, y la suma abajo, sin total ni páginas.
  it("«Cargar más» pide la tanda siguiente con el cursor y la suma abajo", async () => {
    const user = userEvent.setup();
    const requests: URLSearchParams[] = [];
    const entry = (id: string, actionText: string) => ({
      id, occurredAtUtc: "2026-10-02T12:00:00Z", action: "MemberEnabled", actionText, entityType: "Member", entityText: "Usuario",
      affectedDisplayName: "Tomás Acosta", whereText: "Delta S.A.", actorKind: "User", actorText: "Persona", actorId: "actor-1",
      actorDisplayName: "Lucía", actorEmail: "lucia@example.com", changes: [],
    });
    server.use(
      http.get("/api/organization/audit", ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        return HttpResponse.json(params.get("after") === "cursor-1"
          ? { items: [entry("audit-2", "Deshabilitó a Tomás Acosta")], nextCursor: null, hasMore: false }
          : { items: [entry("audit-1", "Habilitó a Tomás Acosta")], nextCursor: "cursor-1", hasMore: true });
      }),
      http.get("/api/organization/audit/actors", () => HttpResponse.json([])),
    );
    renderRouteWithProviders("/org/auditoria", { as: "business-e6-admin" });

    expect(await screen.findByText("Habilitó a Tomás Acosta")).toBeVisible();
    expect(requests[0]?.has("after")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Cargar más" }));

    expect(await screen.findByText("Deshabilitó a Tomás Acosta")).toBeVisible();
    expect(screen.getByText("Habilitó a Tomás Acosta")).toBeVisible();
    expect(requests.at(-1)?.get("after")).toBe("cursor-1");
    expect(requests.at(-1)?.get("period")).toBe("30");
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  // El historial es la consulta principal (`meta.blocksView`, errores.md): un 403 reemplaza la pantalla por «No tenés
  // permiso», como en las demás listas.
  it("un 403 del historial muestra la pantalla sin permiso", async () => {
    server.use(
      http.get("/api/organization/audit", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No tenés permiso." }, { status: 403 })),
      http.get("/api/organization/audit/actors", () => HttpResponse.json([])),
    );
    renderRouteWithProviders("/org/auditoria", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  // Tablero Auditoria-Org: «Quién» ofrece las personas, «Sistema» y «Plataforma», en el orden del back (decisión 77).
  // Una persona se filtra por su id; el sistema y la plataforma, que no tienen, por su tipo (`actorKind`, decisión 76).
  it("«Quién» ofrece las personas, «Sistema» y «Plataforma», y filtra a cada uno por lo suyo", async () => {
    const user = userEvent.setup();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get("/api/organization/audit", ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json({ items: [], nextCursor: null, hasMore: false });
      }),
      http.get("/api/organization/audit/actors", () => HttpResponse.json([
        { actorId: "user-carolina", actorKind: "User", actorText: "Persona", displayName: "Carolina Vega" },
        { actorId: "user-lucia", actorKind: "User", actorText: "Persona", displayName: "Lucía Fernández" },
        { actorId: null, actorKind: "System", actorText: "Sistema", displayName: null },
        { actorId: null, actorKind: "PlatformOperator", actorText: "Plataforma", displayName: null },
      ])),
    );
    const { router } = renderRouteWithProviders("/org/auditoria", { as: "business-e6-admin" });
    expect(await screen.findByText("No hay movimientos para mostrar")).toBeVisible();

    await openMenu(user, "Quién: todos");
    await waitFor(() => expect(screen.getAllByRole("menuitemradio").map((option) => option.textContent))
      .toEqual(["Todas las personas", "Carolina Vega", "Lucía Fernández", "Sistema", "Plataforma"]));
    await user.click(screen.getByRole("menuitemradio", { name: "Sistema" }));
    await waitFor(() => expect(requests.at(-1)?.get("actorKind")).toBe("System"));
    expect(requests.at(-1)?.has("actorId")).toBe(false);
    expect(router.state.location.search).toContain("actorKind=System");

    await openMenu(user, "Sistema");
    await user.click(await screen.findByRole("menuitemradio", { name: "Lucía Fernández" }));
    await waitFor(() => expect(requests.at(-1)?.get("actorId")).toBe("user-lucia"));
    expect(requests.at(-1)?.has("actorKind")).toBe(false);

    await openMenu(user, "Lucía Fernández");
    await user.click(await screen.findByRole("menuitemradio", { name: "Plataforma" }));
    await waitFor(() => expect(requests.at(-1)?.get("actorKind")).toBe("PlatformOperator"));
    expect(requests.at(-1)?.has("actorId")).toBe(false);

    await openMenu(user, "Plataforma");
    await user.click(await screen.findByRole("menuitemradio", { name: "Todas las personas" }));
    await waitFor(() => expect(router.state.location.search).not.toContain("actorKind"));
    expect(requests.at(-1)?.has("actorKind")).toBe(false);
    expect(requests.at(-1)?.has("actorId")).toBe(false);
  });

  // Tablero M-Auditoria-Org y lienzo v99 («Fecha corta»): en el teléfono, cuándo va sin el año si es del año en curso
  // («02/10 09:00»); el de otro año va completo.
  it("en el teléfono, el movimiento del año en curso va sin el año y el de otro año, completo", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-03T15:00:00Z"));
    const restore = asPhone();
    try {
      const entry = { action: "MemberEnabled", entityType: "Member", entityText: "Usuario", affectedDisplayName: "Tomás Acosta", whereText: "Delta S.A.",
        actorKind: "User", actorText: "Persona", actorId: "actor-1", actorDisplayName: "Lucía", actorEmail: "lucia@example.com", changes: [] };
      server.use(
        http.get("/api/organization/audit", () => HttpResponse.json({ items: [
          { ...entry, id: "audit-1", occurredAtUtc: "2026-10-02T12:00:00Z", actionText: "Habilitó a Tomás Acosta" },
          { ...entry, id: "audit-2", occurredAtUtc: "2025-12-30T12:00:00Z", actionText: "Deshabilitó a Tomás Acosta" },
        ], nextCursor: null, hasMore: false })),
        http.get("/api/organization/audit/actors", () => HttpResponse.json([])),
      );
      renderRouteWithProviders("/org/auditoria", { as: "business-e6-admin" });

      const thisYear = (await screen.findByText("Habilitó a Tomás Acosta")).closest("li")!;
      expect(within(thisYear).getByText("02/10 09:00")).toHaveAttribute("datetime", "2026-10-02T12:00:00Z");
      const lastYear = screen.getByText("Deshabilitó a Tomás Acosta").closest("li")!;
      expect(within(lastYear).getByText("30/12/2025 09:00")).toBeInTheDocument();
      // Lienzo v99 (Criterio · Decisiones): debajo del título va el camino, «Administración», y no el período del filtro.
      expect(screen.getByText("Administración", { selector: "[data-slot='app-bar'] span" })).toBeInTheDocument();
      expect(screen.queryByText("Últimos 30 días", { selector: "[data-slot='app-bar'] span" })).not.toBeInTheDocument();
    } finally {
      restore();
      vi.useRealTimers();
    }
  });
});
