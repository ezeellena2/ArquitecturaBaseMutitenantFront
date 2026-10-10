import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { createQueryClient } from "@/shared/api/queryClient";
import type { ApiSchemas, MeResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { fixtureAuth } from "@/test/mocks/authContext";
import { platformOperator } from "@/test/mocks/currentUsers";
import { platformTenantRows, platformTenantsPage } from "@/test/mocks/platformTenants";
import { platformRecoveries } from "@/test/mocks/platformRecoveries";
import { PlatformToResolve } from "./PlatformToResolve";

function mount(permissions = platformOperator.effectivePermissions.platform) {
  const me: MeResponse = { ...platformOperator, effectivePermissions: { organization: [], companies: {}, platform: permissions } };
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const view = render(<AppProviders client={client} authContext={fixtureAuth("platform-operator")}><MemoryRouter><PlatformToResolve /></MemoryRouter></AppProviders>);
  return { ...view, client };
}
const recoveryPage = (items: ApiSchemas["PlatformRecoveryResponse"][]): ApiSchemas["PagedResultOfPlatformRecoveryResponse"] => ({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false });

describe("Para resolver del núcleo de Plataforma", () => {
  it.each([{ permissions: [] }, { permissions: ["platform.tenants.read"] }, { permissions: ["platform.recoveries.manage"] }])("$permissions consulta sólo las áreas permitidas", async ({ permissions }) => {
    const requests: string[] = [];
    server.use(http.get("/api/platform/tenants/paged", ({ request }) => { requests.push("organizations"); expect(new URL(request.url).searchParams.get("status")).toBe("PendingApproval"); return HttpResponse.json(platformTenantsPage([platformTenantRows[0]!], 100)); }),
      http.get("/api/platform/recoveries/paged", ({ request }) => { requests.push("recoveries"); expect(new URL(request.url).searchParams.get("status")).toBe("Pending"); return HttpResponse.json(recoveryPage([platformRecoveries[0]!])); }));
    const app = mount(permissions);
    if (!permissions.length) { await waitFor(() => expect(app.container.querySelector("[data-format-loading]")).toBeNull()); expect(screen.queryByRole("region", { name: "Para resolver" })).not.toBeInTheDocument(); expect(requests).toEqual([]); return; }
    expect(await screen.findByRole("link", { name: "Revisar" })).toBeVisible();
    expect(requests).toEqual([permissions[0] === "platform.tenants.read" ? "organizations" : "recoveries"]);
    expect(screen.queryByText(permissions[0] === "platform.tenants.read" ? "Pablo Ortiz" : "Gamma S.A.")).not.toBeInTheDocument();
  });

  it("lee todas las páginas en orden del servidor y conserva la máscara del teléfono", async () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({ ...platformTenantRows[0]!, id: `org-${index}`, name: `Pendiente ${index}` }));
    const pages: number[] = [];
    server.use(http.get("/api/platform/tenants/paged", ({ request }) => {
      const query = new URL(request.url).searchParams; const page = Number(query.get("page")); pages.push(page);
      expect(query.get("pageSize")).toBe("100"); expect(query.get("sort")).toBe("-createdAtUtc");
      return HttpResponse.json({ items: rows.slice((page - 1) * 100, page * 100), page, pageSize: 100, totalCount: 101, totalPages: 2, hasPrevious: page > 1, hasNext: page < 2 } satisfies ApiSchemas["PagedResultOfPlatformTenantResponse"]);
    }), http.get("/api/platform/recoveries/paged", ({ request }) => {
      expect(new URL(request.url).searchParams.get("sort")).toBe("-createdAt");
      return HttpResponse.json(recoveryPage([{ ...platformRecoveries[0]!, previousMethodType: "Phone", previousMethod: "+54 •••• 1234" }]));
    }));
    mount();
    expect(await screen.findByText("Pendiente 100")).toBeVisible();
    expect(pages).toEqual([1, 2]);
    expect(screen.getByText("+54 •••• 1234")).toBeVisible();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(103);
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Pendiente 0");
    expect(screen.getByText("102")).toBeVisible();
  });

  it("clear cancela una página tardía y no devuelve pendientes de la sesión anterior", async () => {
    let requested = false; let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("/api/platform/tenants/paged", async () => { requested = true; await gate; return HttpResponse.json(platformTenantsPage([platformTenantRows[0]!], 100)); }));
    const app = mount(["platform.tenants.read"]);
    await waitFor(() => expect(requested).toBe(true));
    act(() => { app.client.clear(); });
    await act(async () => { release(); await gate; });
    expect(screen.queryByText("Gamma S.A.")).not.toBeInTheDocument();
    expect(app.client.getQueryCache().findAll({ queryKey: ["platform-home"] }).some((query) => query.state.data !== undefined)).toBe(false);
  });

  it("una página inválida muestra error sin publicar filas parciales ni seguir pidiendo", async () => {
    let requests = 0;
    server.use(http.get("/api/platform/tenants/paged", () => { requests++; return HttpResponse.json({ ...platformTenantsPage([platformTenantRows[0]!], 100), hasNext: true }); }));
    mount(["platform.tenants.read"]);
    expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible();
    expect(screen.queryByText("Gamma S.A.")).not.toBeInTheDocument();
    expect(requests).toBe(1);
  });
});
