import { lazy, useEffect } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MeResponse, PlatformTenantDetailResponse } from "@/shared/api/types";
import { platformOperator } from "@/test/mocks/currentUsers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { ModuleOrganizationUi, ModuleRegistryProvider } from "./ModuleRegistry";
import type { ModuleOrganizationUiProps, ModuleRegistration } from "./types";

let me: MeResponse | undefined;
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: me }) }));
const organization: PlatformTenantDetailResponse = { id: "org", name: "Organización", slug: "org", status: "Active", source: "Platform", createdAtUtc: "2026-10-10T00:00:00Z", version: 2, owners: [], companyCount: 0, memberCount: 0 };
const props = { organization, feature: { key: "optional", enabled: true, source: "Manual", version: 3 } as const, isCurrent: () => true, ownWrite: undefined, onWrite: vi.fn(), onConflict: vi.fn(), dialogOpen: false, onOpenDialog: vi.fn(), onCloseDialog: vi.fn() };

describe("contribución neutral de una fila de organización", () => {
  it.each(["empty", "off", "closed", "forbidden", "unavailable", "waitingMe"])("%s conserva fila genérica sin importar contenido", async (state) => {
    me = state === "waitingMe" ? undefined : platformOperator;
    const load = vi.fn(async () => ({ default: ({ children }: ModuleOrganizationUiProps) => children({ description: "Descripción opcional" }) }));
    const module: ModuleRegistration = { id: "optional", routes: [], organizationUi: { nameKey: "optional:title", guard: () => state === "forbidden" ? "forbidden" : state === "unavailable" ? "unavailable" : "allowed", Content: lazy(load) } };
    renderWithProviders(<ModuleRegistryProvider value={state === "empty" ? [] : [module]}><ModuleOrganizationUi moduleId="optional" {...props}
      organization={state === "closed" ? { ...organization, status: "Closed" } : organization} feature={{ ...props.feature, enabled: state !== "off" }}>
      {(ui) => <p>{ui.description ?? "Fila genérica"}</p>}
    </ModuleOrganizationUi></ModuleRegistryProvider>);
    expect(screen.getByText("Fila genérica")).toBeVisible(); expect(load).not.toHaveBeenCalled();
  });
  it("dos módulos válidos contribuyen independientemente y retirarlos desmonta sus owners", async () => {
    me = platformOperator; const unmount = vi.fn();
    const modules = ["first", "second"].map((id): ModuleRegistration => ({ id, routes: [], organizationUi: { nameKey: `${id}:title`, guard: () => "allowed", Content: ({ children }) => { useEffect(() => () => unmount(id), []); return children({ description: id }); } } }));
    const ui = (registry: readonly ModuleRegistration[]) => <ModuleRegistryProvider value={registry}>{modules.map((module) => <ModuleOrganizationUi key={module.id} moduleId={module.id} {...props} feature={{ ...props.feature, key: module.id }}>{(row) => <p>{row.description ?? `Fila ${module.id}`}</p>}</ModuleOrganizationUi>)}</ModuleRegistryProvider>;
    const view = renderWithProviders(ui(modules)); expect(screen.getByText("first")).toBeVisible(); expect(screen.getByText("second")).toBeVisible();
    view.rerender(ui([])); expect(screen.getByText("Fila first")).toBeVisible(); expect(screen.getByText("Fila second")).toBeVisible(); expect(unmount.mock.calls).toEqual([["first"], ["second"]]);
  });
});
