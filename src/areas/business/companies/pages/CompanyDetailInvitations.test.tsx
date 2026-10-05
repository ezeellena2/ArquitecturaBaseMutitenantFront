import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { HomeResponse } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

// Decisiones del usuario del 2026-10-05 (6e, lienzo v108, tableros Empresa y M-Empresa) y del back (96 a 99): quien
// administra la empresa ve en Miembros las invitaciones de su empresa, las reenvía o las revoca desde su ⋮ y suma personas
// desde los candidatos de la empresa, con el correo tapado. Lo mismo vale para la Dueña: una sola forma. «Hoy» es el
// 01/10/2026: la invitación de Sofía vence el 02/10 y la de Martín venció el 29/09.
const company = {
  id: "company-1", name: "Delta S.A.", taxId: null, timeZoneId: "America/Argentina/Buenos_Aires",
  status: "Active" as const, memberCount: 3, version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
};
const administrator = { id: "role-company-admin", name: "Administrador", isSystemRole: true, scope: "AnyCompany" as const, companyId: null };
const reader = { id: "role-reader", name: "Solo lectura", isSystemRole: false, scope: "SpecificCompany" as const, companyId: "company-1" };
const member = (memberId: string, displayName: string, email: string, extra: Record<string, unknown> = {}) => ({
  memberId, userId: `user-${memberId}`, displayName, email, state: "Active" as const, membershipStatus: "Active" as const,
  roles: [reader], version: 8, createdAtUtc: "2026-09-27T12:00:00Z", invitationId: null, invitationExpiresAtUtc: null, ...extra,
});
const valentina = member("member-valentina", "Valentina Ruiz", "valentina.ruiz@gmail.com", { roles: [administrator] });
const sofia = member("member-sofia", "Sofía Herrera", "sofia.herrera@delta.ejemplo.com",
  { state: "Invited", invitationId: "inv-sofia", invitationExpiresAtUtc: "2026-10-02T15:00:00Z" });
const martin = member("member-martin", "Martín Paz", "martin.paz@delta.ejemplo.com",
  { state: "Invited", invitationId: "inv-martin", invitationExpiresAtUtc: "2026-09-29T15:00:00Z" });
const roleRow = { ...reader, description: null, userCount: 3, permissions: ["company.members.read"], version: 1, createdAtUtc: "2026-09-27T12:00:00Z" };

const page = <T,>(items: readonly T[], pageSize = 10) => ({ items, page: 1, pageSize, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

/// La ficha con sus miembros; cuenta lo que se pide a la API (candidatos, Usuarios, reenviar y revocar).
function companyApi(members: readonly unknown[], candidates: readonly unknown[] = []) {
  const calls = { candidates: 0, users: 0, resend: [] as { invitationId: string; key: string | null }[], revoke: [] as string[],
    added: [] as unknown[] };
  server.use(
    http.get("/api/companies/company-1", () => HttpResponse.json(company)),
    http.get("/api/companies/company-1/members/paged", () => HttpResponse.json(page(members))),
    http.get("/api/companies/company-1/members/filter-counts", () => HttpResponse.json({ all: members.length, active: 1, pendingDeletion: 0, inactive: 0, invited: 2 })),
    http.get("/api/companies/company-1/roles/paged", () => HttpResponse.json(page([{ ...roleRow, ...administrator, description: null }, roleRow], 100))),
    http.get("/api/companies/company-1/candidates/paged", () => { calls.candidates += 1; return HttpResponse.json(page(candidates, 100)); }),
    http.get("/api/users/paged", () => { calls.users += 1; return HttpResponse.json({ code: "Authorization.Forbidden" }, { status: 403 }); }),
    http.post("/api/companies/company-1/invitations/:invitationId/resend", ({ params, request }) => {
      calls.resend.push({ invitationId: String(params.invitationId), key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json("inv-new");
    }),
    http.delete("/api/companies/company-1/invitations/:invitationId", ({ params }) => {
      calls.revoke.push(String(params.invitationId));
      return new HttpResponse(null, { status: 204 });
    }),
    http.post("/api/companies/company-1/members", async ({ request }) => { calls.added.push(await request.json()); return new HttpResponse(null, { status: 204 }); }),
  );
  return calls;
}

const owner = "business-e6-admin" as const;
const companyAdmin = "business-company-admin" as const;

async function openActions(user: ReturnType<typeof userEvent.setup>, name: string) {
  const trigger = await screen.findByRole("button", { name: `Acciones para ${name}` });
  trigger.focus();
  await user.keyboard("{Enter}");
}

beforeAll(async () => { await import("./CompanyDetailPage"); });

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CompanyDetailPage: las invitaciones de la empresa (6e)", () => {
  // Tablero Empresa (v108): la invitación pendiente en petróleo y la vencida en ámbar, con la fecha debajo de la palabra.
  // El estado del back sigue siendo «Invitado» (B8): «vencida» sale de comparar la fecha con la hora actual (decisión 98).
  it.each([[companyAdmin], [owner]])("%s: Miembros muestra «Invitación pendiente» o «Invitación vencida» y, debajo, hasta cuándo vale", async (as) => {
    companyApi([valentina, sofia, martin]);
    const { container } = renderRouteWithProviders("/org/empresas/company-1", { as });

    const pending = (await screen.findByText("Sofía Herrera")).closest("tr")!;
    expect(within(pending).getByText("Invitación pendiente").parentElement!.querySelector("[data-slot='status-dot']")).toHaveClass("bg-[var(--marca)]");
    expect(pending).toHaveTextContent("Vence 02/10/2026");
    const expired = screen.getByText("Martín Paz").closest("tr")!;
    expect(within(expired).getByText("Invitación vencida").parentElement!.querySelector("[data-slot='status-dot']")).toHaveClass("bg-[var(--punto-alerta)]");
    expect(expired).toHaveTextContent("Venció 29/09/2026");
    const active = screen.getByText("Valentina Ruiz").closest("tr")!;
    expect(active).not.toHaveTextContent(/Venc/);
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero Empresa: el ⋮ de una invitación trae solo «Reenviar invitación» y, de peligro, «Revocar invitación»; reenviar
  // manda la misma invitación con su clave de idempotencia (decisión 97) y avisa.
  it.each([[companyAdmin], [owner]])("%s: el ⋮ de la invitación trae «Reenviar invitación» y «Revocar invitación»; reenviar avisa", async (as) => {
    const user = userEvent.setup();
    const calls = companyApi([valentina, sofia]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    await openActions(user, "Sofía Herrera");
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Reenviar invitación", "Revocar invitación"]);
    expect(screen.getByRole("menuitem", { name: "Revocar invitación" })).toHaveAttribute("data-variant", "destructive");
    // «Criterio · Menús» y tablero Empresa (v109): «Revocar invitación» va abajo, después de la franja, en rojo y con la ✕.
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect([...screen.getByRole("menuitem", { name: "Revocar invitación" }).querySelectorAll("svg path")].map((item) => item.getAttribute("d")))
      .toEqual(["M7 7l10 10", "M17 7 7 17"]);
    await user.click(screen.getByRole("menuitem", { name: "Reenviar invitación" }));

    expect(await screen.findByText("Reenviamos la invitación a sofia.herrera@delta.ejemplo.com.")).toBeVisible();
    expect(calls.resend).toEqual([{ invitationId: "inv-sofia", key: expect.stringMatching(/^[0-9a-f-]{36}$/i) }]);
  });

  // Tablero Empresa: revocar es de peligro y pide confirmación con el correo; «Revocar» la cancela entera (decisión 97).
  // El texto (v109) sirve para la Dueña y para el Administrador de empresa, que no puede volver a invitar: solo
  // «El enlace deja de funcionar.».
  it.each([[companyAdmin], [owner]])("%s: «Revocar invitación» confirma con el correo y revoca", async (as) => {
    const user = userEvent.setup();
    const calls = companyApi([valentina, martin]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    await openActions(user, "Martín Paz");
    await user.click(await screen.findByRole("menuitem", { name: "Revocar invitación" }));
    const confirm = await screen.findByRole("dialog", { name: "¿Revocar la invitación a martin.paz@delta.ejemplo.com?" });
    expect(within(confirm).getByText("El enlace deja de funcionar.")).toBeVisible();
    expect(confirm).not.toHaveTextContent("volver a invitar");
    expect(calls.revoke).toEqual([]);
    await user.click(within(confirm).getByRole("button", { name: "Revocar" }));

    expect(await screen.findByText("Revocamos la invitación a martin.paz@delta.ejemplo.com.")).toBeVisible();
    expect(calls.revoke).toEqual(["inv-martin"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // Tablero Empresa, «Administra solo la empresa» (v108): sin Administración en el menú, sin barra de pestañas y sin ⋮ ni
  // «Editar empresa» en la banda. La Dueña («Administra la organización») ve todo eso.
  it.each([[companyAdmin, false], [owner, true]])("%s: Administración, pestañas, ⋮ y «Editar empresa» solo para quien administra la organización", async (as, organization) => {
    companyApi([valentina]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    expect(await screen.findByText("Valentina Ruiz")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    for (const element of [screen.queryByRole("button", { name: "Administración" }), screen.queryByRole("tablist"),
      screen.queryByRole("button", { name: "Más acciones" }), screen.queryByRole("button", { name: "Editar empresa" })]) {
      expect(element !== null).toBe(organization);
    }
    expect(screen.getByRole("button", { name: "Agregar miembro" })).toBeVisible();
  });

  // El back manda `invitationId` solo para la invitación que se resuelve desde esta empresa; sin él, la fila dice el estado
  // y hasta cuándo vale, pero no lleva el ⋮ de la invitación.
  it("una invitación sin `invitationId` va sin el ⋮", async () => {
    companyApi([valentina, { ...sofia, invitationId: null }]);
    renderRouteWithProviders("/org/empresas/company-1", { as: companyAdmin });

    const row = (await screen.findByText("Sofía Herrera")).closest("tr")!;
    expect(row).toHaveTextContent("Invitación pendiente");
    expect(row).toHaveTextContent("Vence 02/10/2026");
    expect(screen.getByRole("button", { name: "Acciones para Valentina Ruiz" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Acciones para Sofía Herrera" })).not.toBeInTheDocument();
  });

  // Tablero Empresa (v108) y decisión 96: «Agregar miembro» lista a los candidatos de la empresa, con el nombre y, debajo,
  // el correo tapado; nunca pide Usuarios, que el Administrador de empresa no ve. La Dueña usa la misma ruta.
  it.each([[companyAdmin], [owner]])("%s: «Agregar miembro» elige entre los candidatos de la empresa, con el correo tapado", async (as) => {
    const user = userEvent.setup();
    const calls = companyApi([valentina], [
      { memberId: "member-julieta", displayName: "Julieta Sosa", maskedEmailAddress: "ju•••@delta.ejemplo.com" },
      { memberId: "member-carolina", displayName: "Carolina Vega", maskedEmailAddress: "ca•••@delta.ejemplo.com" },
    ]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    const person = within(dialog).getByRole("combobox", { name: "Usuario" });
    await waitFor(() => expect(person).toBeEnabled());
    await user.click(person);
    const julieta = await screen.findByRole("option", { name: /Julieta Sosa/ });
    expect(julieta).toHaveTextContent("Julieta Sosaju•••@delta.ejemplo.com");
    expect(within(julieta).getByText("ju•••@delta.ejemplo.com")).toHaveClass("text-[var(--t2)]");
    await user.click(julieta);
    expect(person).toHaveTextContent("Julieta Sosa");
    expect(person).not.toHaveTextContent("ju•••");
    await user.click(within(dialog).getByRole("button", { name: "Agregar miembro" }));

    await waitFor(() => expect(calls.added).toEqual([{ memberId: "member-julieta", roleIds: [] }]));
    expect(await screen.findByText("Agregamos a Julieta Sosa a la empresa.")).toBeVisible();
    expect(calls.candidates).toBeGreaterThan(0);
    expect(calls.users).toBe(0);
  });

  // Decisión 87 y 6e: «Reenviar» de «Para resolver» lleva a la ficha de la empresa, donde la invitación vencida tiene su ⋮.
  it("«Reenviar» de «Para resolver» lleva a la ficha, donde el ⋮ de la invitación vencida la reenvía", async () => {
    const user = userEvent.setup();
    const calls = companyApi([valentina, martin]);
    const pending: HomeResponse["pending"] = [{ area: "users", kind: "invitationExpired", subject: "martin.paz@delta.ejemplo.com", urgent: false,
      sinceUtc: "2026-09-29T15:00:00Z", dueAtUtc: null, targetId: "member-martin", companyId: "company-1", companyName: "Delta S.A." }];
    server.use(http.get("/api/home", () => HttpResponse.json({ organization: null,
      companies: [{ companyId: "company-1", name: "Delta S.A.", roles: ["Administrador"], memberCount: 2 }], pending })));
    renderRouteWithProviders("/org", { as: companyAdmin });

    const toResolve = await screen.findByRole("region", { name: "Para resolver" });
    await user.click(within(toResolve).getByRole("link", { name: "Reenviar" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Delta S.A." })).toBeVisible();
    expect((await screen.findByText("Martín Paz")).closest("tr")).toHaveTextContent("Invitación vencida");
    await openActions(user, "Martín Paz");
    await user.click(await screen.findByRole("menuitem", { name: "Reenviar invitación" }));
    await waitFor(() => expect(calls.resend.map((call) => call.invitationId)).toEqual(["inv-martin"]));
  });
});

describe("CompanyDetailPage en el teléfono: las invitaciones de la empresa (M-Empresa, 6e)", () => {
  // Tablero M-Empresa (v108): en la línea de abajo, los roles, el estado y «vence 02/10» o «venció 29/09», con la fecha
  // corta del teléfono.
  it("la fila de la invitación dice hasta cuándo vale, con la fecha corta", async () => {
    asPhone();
    companyApi([valentina, sofia, martin]);
    renderRouteWithProviders("/org/empresas/company-1", { as: companyAdmin });

    const sofiaRow = (await screen.findByText("Sofía Herrera")).closest("li")!;
    expect(sofiaRow).toHaveTextContent("Solo lectura · Invitación pendiente · vence 02/10");
    expect(screen.getByText("Martín Paz").closest("li")).toHaveTextContent("Solo lectura · Invitación vencida · venció 29/09");
    expect(screen.getByText("Valentina Ruiz").closest("li")).toHaveTextContent("Administrador · Activo");
    // M-Empresa (.w-conv .l3): la línea del estado no se corta con «…»; si no entra, sigue en el renglón de abajo.
    const line = within(sofiaRow).getByText(/vence/).parentElement!;
    expect(line).not.toHaveClass("truncate");
    expect(within(sofiaRow).getByText(/vence/)).not.toHaveClass("truncate");
  });

  // Tablero M-Empresa, «Invitación: acciones»: en el teléfono el ⋮ abre una hoja desde abajo con el nombre de la persona,
  // «Reenviar invitación», una franja y, en rojo, «Revocar invitación», que pide confirmación.
  it.each([[companyAdmin], [owner]])("%s: el ⋮ de la invitación abre la hoja «Invitación: acciones»", async (as) => {
    asPhone();
    const user = userEvent.setup();
    companyApi([valentina, sofia]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    await user.click(await screen.findByRole("button", { name: "Acciones para Sofía Herrera" }));
    const sheet = await screen.findByRole("dialog", { name: "Sofía Herrera" });
    expect(sheet).toHaveClass("bottom-0", "rounded-t-[20px]");
    const menu = within(sheet).getByRole("menu", { name: "Acciones para Sofía Herrera" });
    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Reenviar invitación", "Revocar invitación"]);
    expect(within(menu).getByRole("separator")).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Revocar invitación" })).toHaveClass("text-[var(--peligro)]");
    await user.click(within(menu).getByRole("menuitem", { name: "Revocar invitación" }));

    expect(await screen.findByRole("dialog", { name: "¿Revocar la invitación a sofia.herrera@delta.ejemplo.com?" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Sofía Herrera" })).not.toBeInTheDocument();
  });

  // Tablero M-Empresa, «Administra solo la empresa»: llegó desde su Inicio y vuelve a él, así que la barra de abajo marca
  // Inicio; la Dueña llega a Empresas desde «Más», que queda marcado.
  it.each([[companyAdmin, "Inicio"], [owner, "Más"]])("%s: la barra de abajo marca «%s»", async (as, section) => {
    asPhone();
    companyApi([valentina]);
    renderRouteWithProviders("/org/empresas/company-1", { as });

    expect(await screen.findByText("Valentina Ruiz")).toBeVisible();
    const sections = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(sections).getByRole("link", { name: section })).toHaveAttribute("aria-current", "page");
    expect(within(sections).getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
  });
});
