import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RouteObject } from "react-router";
import { expect, it } from "vitest";
import { routesForHost } from "@/app/routes";
import { mainSiteHost } from "@/tenancy/publicSite";

const inventory = resolve(import.meta.dirname, "../../../ArquitecturaBaseMutitenant/docs/contracts/frontend-routes.json");

function paths(routes: readonly RouteObject[], parent = ""): string[] {
  return routes.flatMap((route) => {
    const path = route.path?.startsWith("/") ? route.path : route.path ? `${parent}/${route.path}` : parent;
    return [...(route.path && !path.includes("*") ? [path] : []), ...paths(route.children ?? [], path)];
  });
}

it("el inventario del backend coincide con las rutas reales del router y sus módulos instalados", () => {
  const routes = [...new Set([...paths(routesForHost(mainSiteHost)), "/silent-renew.html"])].sort();
  expect(routes).toContain("/org/roles/:roleId");
  expect(routes).toContain("/plataforma/cuentas/:id");
  // Regeneración explícita del contrato, igual que npm run contracts; la verificación normal sólo lee.
  if (process.env.UPDATE_FRONTEND_ROUTES === "1") writeFileSync(inventory, `${JSON.stringify(routes, null, 2)}\n`, "utf8");
  expect(JSON.parse(readFileSync(inventory, "utf8"))).toEqual(routes);
});
