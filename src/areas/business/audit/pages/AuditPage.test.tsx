import { screen, waitFor, within } from "@testing-library/react";
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

describe("AuditPage", () => {
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
          changes: [{ field: "Estado", oldValue: "Inactivo", newValue: "Activo" }],
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
    expect(screen.getByRole("columnheader", { name: "Fecha y hora" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Tema: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Quién: todos" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver el detalle de Cambió los roles de Tomás Acosta" }).querySelector("svg")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
    expect(requestUrls[0]?.searchParams.get("period")).toBe("30");
    expect(requestUrls[0]?.searchParams.get("limit")).toBe("25");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ver el detalle de Cambió los roles de Tomás Acosta" }));
    // Detalle: fecha, Quién (nombre · correo), Dónde, «antes → después» y «Cerrar».
    const detail = await screen.findByRole("dialog", { name: "Cambió los roles de Tomás Acosta" });
    expect(detail).toHaveTextContent("02/10/2026");
    expect(detail).toHaveTextContent("QuiénLucía · lucia@example.com");
    expect(detail).toHaveTextContent("DóndeDelta S.A.");
    expect(detail).toHaveTextContent("EstadoInactivo → Activo");
    await user.click(within(detail).getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
