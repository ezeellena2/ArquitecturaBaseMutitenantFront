import { screen } from "@testing-library/react";
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
          actorKind: "User", actorText: "Persona", actorId: "actor-1", actorDisplayName: "Lucía",
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
    expect(await axe(container)).toHaveNoViolations();
    expect(requestUrls[0]?.searchParams.get("period")).toBe("30");
    expect(requestUrls[0]?.searchParams.get("limit")).toBe("25");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ver el detalle de Cambió los roles de Tomás Acosta" }));
    expect(await screen.findByRole("heading", { name: "Cambió los roles de Tomás Acosta" })).toBeVisible();
    expect(screen.getByText("Tomás Acosta")).toBeVisible();
    expect(screen.getByText("Inactivo")).toBeVisible();
    expect(screen.getByText("Activo")).toBeVisible();
  });
});
