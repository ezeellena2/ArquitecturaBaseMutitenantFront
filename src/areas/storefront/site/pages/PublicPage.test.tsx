import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { PublicSiteResponse } from "@/shared/api/types";
import { loginPathOf } from "@/tenancy/access";
import { mainSiteUrl, publicSiteHost } from "@/tenancy/publicSite";
import { publicSiteQueryKey } from "@/tenancy/usePublicSite";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const host = publicSiteHost("grupo-delta");
const delta: PublicSiteResponse = {
  slug: "grupo-delta", name: "Grupo Delta", description: "Grupo Delta y sus empresas, en un solo lugar.",
  logoUrl: "/api/public-site/logo?v=7", address: "Av. Corrientes 1234, piso 5, Buenos Aires",
  phone: "+5491123456789", email: "contacto@delta.ejemplo.com", website: "https://delta.ejemplo.com",
};
let requests: Request[];

function respond(page: PublicSiteResponse = delta) {
  server.use(http.get("/api/public-site", ({ request }) => {
    requests.push(request);
    return HttpResponse.json(page);
  }));
}

beforeAll(async () => { await import("./PublicPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  requests = [];
  respond();
});

describe("PublicPage", () => {
  it.each([
    { culture: "es-AR", phone: "011 15-2345-6789", labels: ["Dirección", "Teléfono", "Correo", "Sitio web"], signIn: "Ingresá para continuar", terms: "Términos", privacy: "Privacidad", footer: "© 2026 Grupo Delta · en ArquitecturaBase" },
    { culture: "en-US", phone: "+54 9 11 2345 6789", labels: ["Address", "Phone", "Email", "Website"], signIn: "Sign in to continue", terms: "Terms", privacy: "Privacy", footer: "© 2026 Grupo Delta · on ArquitecturaBase" },
  ])("mapea el DTO público a la tarjeta compartida y conserva contactos/enlaces en $culture", async (locale) => {
    await changeCulture(locale.culture);
    const { container } = renderRouteWithProviders("/", { host });
    expect(await screen.findByRole("heading", { level: 1, name: delta.name })).toBeVisible();
    expect(screen.getByText(delta.description ?? "")).toBeVisible();
    const main = screen.getByRole("main");
    expect(main.querySelector("img")).toHaveAttribute("src", delta.logoUrl);
    expect(main.querySelector("img")).toHaveAttribute("alt", "");
    expect(within(main).queryByText("GD")).not.toBeInTheDocument();
    expect(within(main).getAllByRole("listitem").map((row) => row.querySelector("span > span")?.textContent)).toEqual(locale.labels);
    expect(await screen.findByRole("link", { name: locale.phone })).toHaveAttribute("href", `tel:${delta.phone}`);
    expect(screen.queryByText(delta.phone ?? "")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: delta.email ?? "" })).toHaveAttribute("href", `mailto:${delta.email}`);
    expect(screen.getByRole("link", { name: "delta.ejemplo.com" })).toHaveAttribute("href", delta.website);
    // T14 deja la puerta Consumer existente; T15 implementa la sesión y el regreso al subdominio.
    expect(screen.getByRole("link", { name: locale.signIn })).toHaveAttribute("href", mainSiteUrl(loginPathOf("consumer")));
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", mainSiteUrl());
    expect(screen.getByRole("link", { name: locale.terms })).toHaveAttribute("href", mainSiteUrl("/terminos"));
    expect(screen.getByRole("link", { name: locale.privacy })).toHaveAttribute("href", mainSiteUrl("/privacidad"));
    expect(screen.getByText(locale.footer)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0].url).pathname).toBe("/api/public-site");
    expect(new URL(requests[0].url).search).toBe("");
    expect(requests[0].headers.get("X-Tenant-Id")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("conserva iniciales y omite datos no cargados sin agregar contactos ni consultar administración", async () => {
    const privateRequest = vi.fn();
    server.use(http.get("/api/organization/public-page", () => { privateRequest(); return HttpResponse.json({}); }));
    respond({ slug: delta.slug, name: delta.name, description: "  ", logoUrl: null, address: "", phone: null, email: delta.email, website: null });
    const { container } = renderRouteWithProviders("/", { host });
    await screen.findByRole("heading", { level: 1, name: delta.name });
    expect(screen.getByText("GD")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("main").querySelector("img")).toBeNull();
    expect(within(screen.getByRole("main")).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: delta.email ?? "" })).toBeVisible();
    for (const label of ["Dirección", "Teléfono", "Sitio web"]) expect(screen.queryByText(label)).not.toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(privateRequest).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("solo el 404 público exacto muestra No disponible sin revelar el motivo y con el mismo marco", async () => {
    server.use(http.get("/api/public-site", ({ request }) => {
      requests.push(request);
      return HttpResponse.json({ code: "PublicSite.PublicPage.NotFound", detail: "Motivo privado que no se debe revelar." }, { status: 404 });
    }));
    const { container } = renderRouteWithProviders("/", { host });
    expect(await screen.findByRole("heading", { level: 1, name: "Esta página no está disponible" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a ArquitecturaBase" })).toHaveAttribute("href", mainSiteUrl());
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", mainSiteUrl());
    expect(screen.getByText("© 2026 ArquitecturaBase")).toBeVisible();
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", mainSiteUrl("/terminos"));
    expect(screen.queryByText("Motivo privado que no se debe revelar.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ingresá para continuar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    { status: 404, code: "General.NotFound", detail: "No pudimos leer esta página.", message: "No pudimos leer esta página." },
    { status: 500, code: "General.Unexpected", detail: "Detalle técnico interno", message: "Algo salió mal. Probá de nuevo en un rato." },
  ])("conserva $status/$code como error común y reintenta la lectura pública", async (failure) => {
    const user = userEvent.setup();
    server.use(http.get("/api/public-site", ({ request }) => {
      requests.push(request);
      return requests.length === 1 ? HttpResponse.json(failure, { status: failure.status }) : HttpResponse.json(delta);
    }));
    const { container } = renderRouteWithProviders("/", { host });
    expect(await screen.findByRole("alert")).toHaveTextContent(failure.message);
    expect(screen.queryByRole("heading", { name: "Esta página no está disponible" })).not.toBeInTheDocument();
    expect(screen.queryByText("Detalle técnico interno")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: delta.name })).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].url).toBe(requests[0].url);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a 390 conserva la tarjeta pública, sin hamburguesa ni barra inferior de la app", async () => {
    const restore = asPhone();
    const previousWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = renderRouteWithProviders("/", { host });
      expect(await screen.findByRole("heading", { level: 1, name: delta.name })).toBeVisible();
      expect(await screen.findByRole("link", { name: "011 15-2345-6789" })).toHaveAttribute("href", `tel:${delta.phone}`);
      expect(within(screen.getByRole("main")).getAllByRole("listitem")).toHaveLength(4);
      expect(screen.getByRole("link", { name: "Ingresá para continuar" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Abrir el menú" })).not.toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Más" })).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      restore();
      Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: previousWidth });
    }
  });

  it("si falla una relectura conserva la tarjeta publicada y reintenta sin borrar sus datos", async () => {
    const user = userEvent.setup();
    const { container, queryClient } = renderRouteWithProviders("/", { host });
    await screen.findByRole("heading", { level: 1, name: delta.name });
    server.use(http.get("/api/public-site", () => HttpResponse.json({ code: "General.Unexpected" }, { status: 500 })));
    await act(async () => { await queryClient.invalidateQueries({ queryKey: publicSiteQueryKey(host) }); });
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(screen.getByRole("heading", { level: 1, name: delta.name })).toBeVisible();
    expect(screen.getByRole("link", { name: delta.email ?? "" })).toBeVisible();
    expect(screen.getByText("© 2026 Grupo Delta · en ArquitecturaBase")).toBeVisible();
    respond({ ...delta, name: "Grupo Delta actualizado" });
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Grupo Delta actualizado" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    { host, path: "/org/usuarios" },
    { host: "grupo-delta.localtest.me:5175", path: "/" },
  ])("el host $host y la ruta $path mantienen la frontera sin leer la página ni datos privados", async (route) => {
    const privateRequest = vi.fn();
    server.use(http.get("/api/users", () => { privateRequest(); return HttpResponse.json({}); }));
    const { container } = renderRouteWithProviders(route.path, { host: route.host });
    await screen.findByRole("heading", { level: 1, name: "Esta página no está disponible" });
    expect(screen.getByText("© 2026 ArquitecturaBase")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a ArquitecturaBase" })).toHaveAttribute("href", mainSiteUrl());
    expect(requests).toHaveLength(0);
    expect(privateRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
