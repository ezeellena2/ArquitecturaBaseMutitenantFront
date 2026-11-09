import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, MemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import type { NotificationItem } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { ModuleRegistration } from "@/shared/modules/types";
import { fixtureAuth } from "@/test/mocks/authContext";
import { currentUsers, type CurrentUserFixture } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { AppShell } from "../AppShell";
import { BusinessLayout } from "../BusinessLayout";
import { PersonalLayout } from "../PersonalLayout";
import { PlatformLayout } from "../PlatformLayout";
import { PhoneNotificationBell } from "./NotificationBell";

const loginMethod: NotificationItem = { id: "personalLoginMethod", kind: "personalLoginMethod", params: {}, occurredAtUtc: "2026-09-20T13:12:00Z", link: "/cuenta", read: false };
const recovery: NotificationItem = { id: "recoveryRequested:pablo", kind: "recoveryRequested", params: { name: "Pablo Ortiz" }, occurredAtUtc: "2026-09-27T13:20:00Z", link: "/plataforma/recuperaciones", read: false };
const organization: NotificationItem = { id: "organizationPending:gamma", kind: "organizationPending", params: { name: "Gamma S.A." }, occurredAtUtc: "2026-09-27T12:05:00Z", link: "/plataforma/organizaciones/gamma", read: false };
const loginMethodText = "Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa";

/** La campana del back: la lista y marcar leído, que cambia lo que devuelve la próxima lectura. Devuelve lo que se pidió marcar. */
function serveNotifications(...items: NotificationItem[]) {
  const list = items.map((item) => ({ ...item }));
  const marked: string[] = [];
  server.use(
    http.get("/api/notifications", () => HttpResponse.json({ items: list, unread: list.filter((item) => !item.read).length })),
    http.post("/api/notifications/:id/read", ({ request }) => {
      marked.push(new URL(request.url).pathname);
      const item = list.find((entry) => `/api/notifications/${encodeURIComponent(entry.id)}/read` === new URL(request.url).pathname);
      if (item) item.read = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return marked;
}

/** Un aviso de la lista por cómo empieza su nombre: el texto y, si no se leyó, «, sin leer»; después, la fecha. */
const named = (start: string) => new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

function Here() {
  const { pathname } = useLocation();
  return <h1>{pathname}</h1>;
}

const layouts = { consumer: PersonalLayout, business: BusinessLayout, platform: PlatformLayout } as const;

/** El marco de cada acceso dentro de `AppShell`, con una pantalla que dice dónde está. */
function renderFrame(as: CurrentUserFixture, path: string, options: { modules?: readonly ModuleRegistration[]; onReload?: () => void } = {}) {
  const account = currentUsers[as];
  const Layout = layouts[account.access];
  server.use(meHandlerFor(account));
  const router = createMemoryRouter([{ element: <AppShell onReload={options.onReload} />, children: [{ path: "*", element: <Layout><Here /></Layout> }] }],
    { initialEntries: [path] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  render(<AppProviders client={client} authContext={fixtureAuth(as)} modules={options.modules}><RouterProvider router={router} /></AppProviders>);
  return router;
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

// Tableros Campana y Campana-Plat: la campana en la barra de arriba de la compu, con el número de lo que lista sin leer.
describe("la campana en la compu", () => {
  it.each([
    ["consumer-empty", "/", [loginMethod], "Avisos: 1", loginMethodText, "20/09/2026 10:12"],
    ["business-admin", "/org", [loginMethod], "Avisos: 1", loginMethodText, "20/09/2026 10:12"],
    ["platform-operator", "/plataforma", [recovery, organization], "Avisos: 2", "Pablo Ortiz pidió recuperar su cuenta", "27/09/2026 10:20"],
  ] as const)("en %s va antes de tu menú, con el número sin leer, y abre «Avisos»", async (as, path, items, label, text, date) => {
    serveNotifications(...items);
    const user = userEvent.setup();
    renderFrame(as, path);

    const bell = await screen.findByRole("button", { name: label });
    expect(within(screen.getByRole("banner")).getByRole("button", { name: label })).toBe(bell);
    expect(bell.nextElementSibling).toHaveAttribute("aria-haspopup", "menu");
    expect(within(bell).getByText(String(items.length))).toBeInTheDocument();

    bell.focus();
    await user.keyboard("{Enter}");
    const list = await screen.findByRole("dialog", { name: "Avisos" });
    const rows = within(list).getAllByRole("link");
    expect(rows).toHaveLength(items.length);
    expect(rows[0]).toHaveAccessibleName(named(`${text}, sin leer`));
    expect(await within(rows[0]).findByText(date)).toBeVisible();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("tocar un aviso sin leer lo marca leído, lleva a su link y baja el número; uno leído solo lleva", async () => {
    const marked = serveNotifications(organization, { ...recovery, read: true });
    const user = userEvent.setup();
    const router = renderFrame("platform-operator", "/plataforma");

    await user.click(await screen.findByRole("button", { name: "Avisos: 1" }));
    let list = await screen.findByRole("dialog", { name: "Avisos" });
    expect(within(list).getByRole("link", { name: named("Pablo Ortiz pidió recuperar su cuenta") })).not.toHaveAccessibleName(/sin leer/);
    await user.click(within(list).getByRole("link", { name: named("Gamma S.A. espera aprobación, sin leer") }));

    expect(await screen.findByRole("heading", { name: "/plataforma/organizaciones/gamma" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Avisos" })).not.toBeInTheDocument();
    await waitFor(() => expect(marked).toEqual(["/api/notifications/organizationPending%3Agamma/read"]));
    const bell = await screen.findByRole("button", { name: "Avisos" });

    await user.click(bell);
    list = await screen.findByRole("dialog", { name: "Avisos" });
    expect(within(list).getByRole("link", { name: named("Gamma S.A. espera aprobación") })).not.toHaveAccessibleName(/sin leer/);
    await user.click(within(list).getByRole("link", { name: named("Pablo Ortiz pidió recuperar su cuenta") }));
    expect(router.state.location.pathname).toBe("/plataforma/recuperaciones");
    expect(marked).toHaveLength(1);
  });

  it("un aviso que el front no sabe leer no se ve ni cuenta; sin el nombre, se dice sin él", async () => {
    serveNotifications({ ...organization, params: {} },
      { id: "formularios:1", kind: "formRejected", params: { form: "Visita a cliente" }, occurredAtUtc: "2026-09-27T13:38:00Z", link: "/plataforma", read: false });
    const user = userEvent.setup();
    renderFrame("platform-operator", "/plataforma");

    await user.click(await screen.findByRole("button", { name: "Avisos: 1" }));
    const rows = within(await screen.findByRole("dialog", { name: "Avisos" })).getAllByRole("link");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAccessibleName(named("Una organización espera aprobación, sin leer"));
  });

  it("un módulo arma el texto de sus avisos; la campana consulta antes los del núcleo", async () => {
    const forms: ModuleRegistration = { id: "formularios", routes: [], notifications: [
      { kind: "formRejected", describe: (item) => ({ text: `WhatsApp rechazó ${item.params.form}`, tone: "failed" }) },
      { kind: "personalLoginMethod", describe: () => ({ text: "Otro texto", tone: "failed" }) },
    ] };
    serveNotifications({ id: "formularios:1", kind: "formRejected", params: { form: "Visita a cliente" }, occurredAtUtc: "2026-09-27T13:38:00Z", link: "/org", read: false },
      { ...loginMethod, read: true });
    const user = userEvent.setup();
    renderFrame("business-admin", "/org", { modules: [forms] });

    await user.click(await screen.findByRole("button", { name: "Avisos: 1" }));
    const rows = within(await screen.findByRole("dialog", { name: "Avisos" })).getAllByRole("link");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("WhatsApp rechazó Visita a cliente"), expect.stringContaining(loginMethodText),
    ]);
  });

  it("la versión nueva va primera, sin leer y en el número, sin franja, y abrirla recarga", async () => {
    serveNotifications({ ...loginMethod, read: true });
    const onReload = vi.fn();
    const user = userEvent.setup();
    renderFrame("business-admin", "/org", { onReload });
    expect(await screen.findByRole("button", { name: "Avisos" })).toBeVisible();

    const event = new CustomEvent("vite:preloadError", { cancelable: true, detail: new Error("chunk") });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("status", { name: /versión nueva/ })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Avisos: 1" }));
    const [first, second] = within(await screen.findByRole("dialog", { name: "Avisos" })).getAllByRole("listitem");
    const version = within(first).getByRole("button", { name: named("Hay una versión nueva del sistema, sin leer") });
    expect(within(second).getByRole("link")).toHaveAccessibleName(named(loginMethodText));
    expect(onReload).not.toHaveBeenCalled();

    await user.click(version);
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("sin avisos va sin número y dice «No hay avisos.»", async () => {
    const user = userEvent.setup();
    renderFrame("business-admin", "/org");

    await user.click(await screen.findByRole("button", { name: "Avisos" }));
    const list = await screen.findByRole("dialog", { name: "Avisos" });
    expect(await within(list).findByText("No hay avisos.")).toBeVisible();
    expect(within(list).queryByRole("link")).not.toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("si la campana no se pudo leer, lo dice en su lista y ofrece «Reintentar»", async () => {
    let fails = true;
    server.use(http.get("/api/notifications", () => fails ? HttpResponse.json({ code: "Server.Error" }, { status: 500 })
      : HttpResponse.json({ items: [loginMethod], unread: 1 })));
    const user = userEvent.setup();
    renderFrame("business-admin", "/org");

    await user.click(await screen.findByRole("button", { name: "Avisos" }));
    const list = await screen.findByRole("dialog", { name: "Avisos" });
    expect(await within(list).findByText("No pudimos cargar los avisos.")).toBeVisible();
    fails = false;
    await user.click(within(list).getByRole("button", { name: "Reintentar" }));
    expect(await within(list).findByRole("link", { name: named(`${loginMethodText}, sin leer`) })).toBeVisible();
  });
});

// M-Inicio-Org (`.c-campana`): la de la cabecera verde del Inicio del teléfono, blanca, que también lleva a «Avisos».
it("la campana de la cabecera del teléfono lleva a «Avisos» con el número", async () => {
  serveNotifications(loginMethod);
  server.use(meHandlerFor(currentUsers["business-admin"]));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  render(<AppProviders client={client} authContext={fixtureAuth("business-admin")}>
    <MemoryRouter><PhoneNotificationBell tone="cover" /></MemoryRouter>
  </AppProviders>);

  const bell = await screen.findByRole("link", { name: "Avisos: 1" });
  expect(bell).toHaveAttribute("href", "/avisos");
  expect(bell).toHaveClass("size-11", "text-[var(--lado-activo)]");
});
