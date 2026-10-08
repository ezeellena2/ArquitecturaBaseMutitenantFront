import { isValidElement } from "react";
import { Outlet, type LazyRouteFunction, type RouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/layouts/AppShell";
import { SessionRecovery } from "@/auth/SessionRecovery";
import { mainSiteHost } from "@/tenancy/publicSite";
import { createStorefrontRoutes, routes, routesForHost } from "./routes";

function paths(tree: RouteObject[]): string[] {
  return tree.flatMap((route) => [...(route.path === undefined ? [] : [route.path]), ...paths(route.children ?? [])]);
}

function find(tree: RouteObject[], path: string): RouteObject | undefined {
  for (const route of tree) {
    if (route.path === path) return route;
    const child = find(route.children ?? [], path);
    if (child) return child;
  }
  return undefined;
}

describe("rutas por host (docs/rules/accesos-y-permisos.md)", () => {
  it("en el subdominio solo monta la página y callback, sin administración, cuenta, ingresos ni directorio", () => {
    const tree = routesForHost("grupo-delta.localtest.me:5174");
    expect(paths(tree)).toEqual(["/auth/callback", "/", "*"]);
    for (const path of ["/org", "/cuenta", "/plataforma", "/login", "/login/enlace", "/empresas"]) expect(paths(tree)).not.toContain(path);
    expect(isValidElement(tree[0].element) && tree[0].element.type).toBe(AppShell);
    const recovery = tree[0].children?.find((route) => route.children?.some((child) => child.path === "/"));
    const element = recovery?.element;
    expect(isValidElement(element) && element.type).toBe(SessionRecovery);
  });

  it("en el dominio principal conserva el árbol exportado y suma /empresas", () => {
    expect(routesForHost(mainSiteHost)).toBe(routes);
    expect(paths(routes).filter((path) => path === "/login/enlace")).toHaveLength(1);
    expect(paths(routes)).toEqual(expect.arrayContaining(["/", "/org", "/cuenta", "/plataforma", "/login", "/empresas"]));
  });

  it("la raíz del subdominio carga la página publicada y las rutas desconocidas conservan la frontera", () => {
    const storefront = routesForHost("grupo-delta.localtest.me:5174");
    const published = find(storefront, "/")?.lazy;
    const unavailable = find(storefront, "*")?.lazy;
    expect(published).toBeTypeOf("function");
    expect(unavailable).toBeTypeOf("function");
    expect(published).not.toBe(unavailable);
    expect(find(routesForHost("otra.example.test:5174"), "*")?.lazy).toBe(unavailable);
  });

  it.each(["a.b.localtest.me:5174", "grupo-delta.localtest.me:5175", "otro.example.test:5174", "127.0.0.1:5174", "ab.localtest.me:5174"])(
    "un host desconocido muestra la frontera uniforme y no monta callback: %s", (host) => {
      const tree = routesForHost(host);
      expect(paths(tree)).toEqual(["*"]);
      expect(find(tree, "/auth/callback")).toBeUndefined();
      expect(isValidElement(tree[0].element) && tree[0].element.type).toBe(AppShell);
    },
  );

  it("admite loaders configurables sin modificar el directorio lazy del árbol principal", () => {
    const defaultDirectory = find(routes, "/empresas")?.lazy;
    expect(defaultDirectory).toBeTypeOf("function");
    const page: LazyRouteFunction<RouteObject> = async () => ({ Component: Outlet });
    expect(find(createStorefrontRoutes(page), "/")?.lazy).toBe(page);
    expect(find(routesForHost("grupo-delta.localtest.me:5174", { storefront: page }), "/")?.lazy).toBe(page);
    expect(find(routesForHost(mainSiteHost, { directory: page }), "/empresas")?.lazy).toBe(page);
    expect(find(routes, "/empresas")?.lazy).toBe(defaultDirectory);
  });
});
