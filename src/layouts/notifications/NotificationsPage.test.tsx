import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import type { NotificationItem } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { currentUsers } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { AppShell } from "../AppShell";

const loginMethod: NotificationItem = { id: "personalLoginMethod", kind: "personalLoginMethod", params: {}, occurredAtUtc: "2026-09-20T13:12:00Z", link: "/cuenta", read: false };
const recovery: NotificationItem = { id: "recoveryRequested:pablo", kind: "recoveryRequested", params: { name: "Pablo Ortiz" }, occurredAtUtc: "2026-09-27T13:20:00Z", link: "/plataforma/recuperaciones", read: false };
const loginMethodText = "Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa";

function serveNotifications(...items: NotificationItem[]) {
  const marked: string[] = [];
  server.use(
    http.get("/api/notifications", () => HttpResponse.json({ items, unread: items.filter((item) => !item.read).length })),
    http.post("/api/notifications/:id/read", ({ request }) => {
      marked.push(new URL(request.url).pathname);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return marked;
}

const named = (start: string) => new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

let restore: () => void = () => {};
beforeAll(async () => { await import("./NotificationsPage"); await import("../MorePage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  restore = asPhone();
});
afterEach(() => restore());

// Tableros M-Campana, M-Campana-Plat y M-Campana-Personal: en el teléfono, la campana va en la barra de arriba y lleva a
// «Avisos», con ‹ y el nombre del perfil debajo del título.
describe("la campana en el teléfono", () => {
  it.each([
    ["consumer-empty", "/mas", "/avisos", "Personal", loginMethod, loginMethodText, "20/09/2026 10:12"],
    ["business-admin", "/mas", "/avisos", "Empresa A", loginMethod, loginMethodText, "20/09/2026 10:12"],
    ["platform-operator", "/plataforma/mas", "/plataforma/avisos", "Plataforma", recovery, "Pablo Ortiz pidió recuperar su cuenta", "27/09/2026 10:20"],
  ] as const)("en %s, la campana de la barra lleva a «Avisos»", async (as, from, to, profile, item, text, date) => {
    serveNotifications(item);
    const user = userEvent.setup();
    const { router, container } = renderRouteWithProviders(from, { as });

    const bell = await screen.findByRole("link", { name: "Avisos: 1" });
    expect(bell.closest("header")).toHaveAttribute("data-slot", "app-bar");
    await user.click(bell);

    const title = await screen.findByRole("heading", { level: 1, name: "Avisos" });
    expect(router.state.location.pathname).toBe(to);
    const bar = title.closest("header")!;
    expect(within(bar).getByText(profile)).toBeVisible();
    expect(within(bar).getByRole("link", { name: "Volver" })).toHaveAttribute("href", from);
    expect(within(bar).queryByRole("link", { name: /^Avisos/ })).not.toBeInTheDocument();
    const row = await screen.findByRole("link", { name: named(`${text}, sin leer`) });
    expect(await within(row).findByText(date)).toBeVisible();
    // M-Campana-Personal: «Avisos» no es una sección de la barra de abajo.
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tocar un aviso sin leer lo marca leído y lleva a su link", async () => {
    const marked = serveNotifications(loginMethod);
    const user = userEvent.setup();
    const { router } = renderRouteWithProviders("/avisos", { as: "business-admin" });

    await user.click(await screen.findByRole("link", { name: named(`${loginMethodText}, sin leer`) }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/cuenta"));
    await waitFor(() => expect(marked).toEqual(["/api/notifications/personalLoginMethod/read"]));
  });

  it("sin avisos dice «No hay avisos.», y ‹ sin pantalla de origen vuelve al Inicio", async () => {
    const { container } = renderRouteWithProviders("/plataforma/avisos", { as: "platform-operator" });

    expect(await screen.findByText("No hay avisos.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/plataforma");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("la versión nueva va primera y sin leer, y tocarla recarga", async () => {
    serveNotifications({ ...loginMethod, read: true });
    server.use(meHandlerFor(currentUsers["consumer-empty"]));
    const onReload = vi.fn();
    const user = userEvent.setup();
    const router = createMemoryRouter([{ ...routes[0], element: <AppShell onReload={onReload} /> }], { initialEntries: ["/avisos"] });
    const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
    render(<AppProviders client={client} authContext={fixtureAuth("consumer-empty")}><RouterProvider router={router} /></AppProviders>);
    expect(await screen.findByRole("link", { name: named(loginMethodText) })).toBeVisible();

    act(() => { window.dispatchEvent(new CustomEvent("vite:preloadError", { cancelable: true, detail: new Error("chunk") })); });
    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByRole("button", { name: named("Hay una versión nueva del sistema, sin leer") })).toBeVisible();
    expect(within(second).getByRole("link")).toHaveAccessibleName(named(loginMethodText));
    await user.click(within(first).getByRole("button"));
    expect(onReload).toHaveBeenCalledOnce();
  });
});

it("en la compu «Avisos» no existe: la campana abre su lista arriba, y la ruta vuelve al Inicio", async () => {
  restore();
  const { router } = renderRouteWithProviders("/avisos", { as: "business-admin" });
  await waitFor(() => expect(router.state.location.pathname).toBe("/org"));
});
