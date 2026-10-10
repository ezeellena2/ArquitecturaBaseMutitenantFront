import { lazy, useEffect } from "react";
import { MemoryRouter } from "react-router";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { businessUser, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { ModuleHome, ModuleRegistryProvider, ModuleRoutePage } from "./ModuleRegistry";
import type { ModuleAccess, ModuleRegistration } from "./types";
import type { MeResponse } from "@/shared/api/types";

let me: MeResponse | undefined;
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: me }) }));

describe("registro neutral antes de lazy", () => {
  it("las páginas de gestión usan su propia guarda aunque el chat no esté disponible", async () => {
    me = { ...platformOperator, moduleCapabilities: [{ key: "optional", available: false, canConfigure: true, canReadUsage: false }] };
    const configure = vi.fn(async () => ({ default: () => <p>{"Configuración permitida"}</p> }));
    const usage = vi.fn(async () => ({ default: () => null }));
    const modules: ModuleRegistration[] = [{ id: "optional", routes: [
      { access: "platform", path: "/config", guard: (account) => account.moduleCapabilities?.[0]?.canConfigure ? "allowed" : "forbidden", Page: lazy(configure) },
      { access: "platform", path: "/usage", guard: (account) => account.moduleCapabilities?.[0]?.canReadUsage ? "allowed" : "forbidden", Page: lazy(usage) },
    ] }];
    const ui = (path: string) => <MemoryRouter><ModuleRegistryProvider value={modules}><ModuleRoutePage moduleId="optional" path={path} /></ModuleRegistryProvider></MemoryRouter>;
    const view = renderWithProviders(ui("/config"));
    expect(await screen.findByText("Configuración permitida")).toBeVisible();
    view.rerender(ui("/usage"));
    expect(screen.getByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(configure).toHaveBeenCalledOnce();
    expect(usage).not.toHaveBeenCalled();
  });
  it.each([consumerWithoutOrganizations, businessUser, platformOperator])("$access no carga una página no registrada, apagada o prohibida", async (account) => {
    me = account;
    for (const status of ["unregistered", "unavailable", "forbidden"] as const) {
      const load = vi.fn(async () => ({ default: () => <p>{"Contenido privado"}</p> }));
      const modules: ModuleRegistration[] = [{ id: "optional", routes: [{ access: account.access, path: "/optional", guard: () => status === "forbidden" ? "forbidden" : "unavailable", Page: lazy(load) }] }];
      const view = renderWithProviders(<MemoryRouter><ModuleRegistryProvider value={status === "unregistered" ? [] : modules}>
        <ModuleRoutePage moduleId="optional" path="/optional" />
      </ModuleRegistryProvider></MemoryRouter>);
      await screen.findByRole("heading", { name: status === "forbidden" ? "No tenés permiso para ver esta página" : "No encontramos esta página" });
      expect(load).not.toHaveBeenCalled();
      view.unmount();
    }
  });
  it("espera Me sin 404 y sólo después de autorizar monta el import", async () => {
    me = undefined;
    const load = vi.fn(async () => ({ default: () => <p>{"Contenido privado"}</p> }));
    const modules: ModuleRegistration[] = [{ id: "optional", routes: [{ access: "consumer", path: "/optional", guard: () => "allowed", Page: lazy(load) }] }];
    const ui = () => <MemoryRouter><ModuleRegistryProvider value={modules}><ModuleRoutePage moduleId="optional" path="/optional" /></ModuleRegistryProvider></MemoryRouter>;
    const view = renderWithProviders(ui());
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
    me = consumerWithoutOrganizations;
    view.rerender(ui());
    expect(await screen.findByText("Contenido privado")).toBeVisible();
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("desmonta el contenido al revocar permiso o quitar registro y conserva el inicio del núcleo", async () => {
    me = consumerWithoutOrganizations;
    let status: ModuleAccess = "allowed";
    const unmount = vi.fn();
    const Content = () => { useEffect(() => unmount, []); return <p>{"Módulo"}</p>; };
    const module: ModuleRegistration = { id: "optional", routes: [], home: { guard: () => status, Content } };
    const ui = (modules: ModuleRegistration[]) => <ModuleRegistryProvider value={modules}><ModuleHome access="consumer" fallback={<p>{"Inicio anterior"}</p>} /></ModuleRegistryProvider>;
    const view = renderWithProviders(ui([module]));
    expect(await screen.findByText("Módulo")).toBeVisible();
    status = "forbidden";
    view.rerender(ui([module]));
    expect(screen.getByText("Inicio anterior")).toBeVisible();
    expect(unmount).toHaveBeenCalledOnce();
    view.rerender(ui([]));
    expect(screen.getByText("Inicio anterior")).toBeVisible();
  });
});


