import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { StrictMode } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "./mocks/authContext";
import { server } from "./mocks/server";
import { asPhone } from "./utils/phone";
import type { GalleryApp } from "./gallery";
import { etapa9GalleryCases, etapa9GalleryPending } from "./etapa9Gallery";

// La galería de la E9 (scripts/capturas/etapa-9.json), como la de la E11: cada caso es un estado del tablero vigente y la
// app real se arma solo con sus respuestas, sin pedir nada sin responder. Con UPDATE_GALLERY=1 vuelve a escribir el archivo
// de casos que usa `capturar-etapa.mjs --casos scripts/capturas/etapa-9.json`.
const root = path.resolve(import.meta.dirname, "../..");
const canvas = path.join(root, "docs/design/lienzo");
const issuer = "http://localtest.me:5192";

function boardChoices(board: string): Record<string, readonly string[]> {
  const html = readFileSync(path.join(canvas, `${board}.dc.html`), "utf8");
  const attribute = html.match(/<script\b[^>]*\bdata-dc-script\b[^>]*\bdata-props='([^']+)'/);
  if (!attribute) return {};
  const props = JSON.parse(attribute[1]) as Record<string, { options?: string[]; default?: string }>;
  return Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith("$")).map(([key, field]) => [key, field.options ?? [field.default ?? ""]]));
}

// Como el arnés visual: sin sesión, el ingreso arranca con un AuthContext anónimo.
const anonymous = { isAuthenticated: false, isLoading: false, signinRedirect: vi.fn(async () => {}), signoutRedirect: vi.fn(async () => {}), removeUser: async () => {} } as unknown as AuthContextProps;

function mount(app: GalleryApp) {
  const missing: string[] = [];
  const completed = new Set<string>();
  server.use(http.all("/api/*", ({ request }) => {
    const url = new URL(request.url);
    const response = app.responses.find((item) => item.method === request.method && item.path === url.pathname
      && (!item.afterResponse || completed.has(`${item.afterResponse.method} ${item.afterResponse.path}`))
      && Object.entries(item.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value));
    if (!response) {
      // Como el arnés: el catálogo de referencia y los métodos de ingreso los sirve el fixture común si el caso no los pisa.
      if (url.pathname === "/api/reference-data" || url.pathname === "/api/auth/methods") return undefined;
      missing.push(`${request.method} ${url.pathname}${url.search}`);
      return HttpResponse.json({ code: "Capture.UnmockedRoute" }, { status: 501 });
    }
    completed.add(`${response.method} ${response.path}`);
    if (response.status === 204) return new HttpResponse(null, { status: 204 });
    return HttpResponse.json(response.body ?? {}, { status: response.status });
  }));
  const route = new URL(app.path, issuer).searchParams.get("route")!;
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const auth = app.userFixture === "anonymous" ? anonymous : fixtureAuth(app.userFixture);
  render(<StrictMode><AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders></StrictMode>);
  return { missing, user: userEvent.setup() };
}

async function run(app: GalleryApp, user: ReturnType<typeof userEvent.setup>) {
  for (const action of app.actions) {
    if (action.type === "otp") { fireEvent.change(await screen.findByRole("textbox", { name: "Código 1" }), { target: { value: action.value } }); continue; }
    const surface = action.within ? within(await screen.findByRole(action.within.role, { name: action.within.name })) : screen;
    const target = action.label ? await surface.findByLabelText(action.label, { exact: action.exact ?? false })
      : await surface.findByRole(action.role!, { name: action.name });
    if (action.type === "click") await user.click(target);
    else if (action.type === "press") { target.focus(); await user.keyboard(`{${action.key}}`); }
    else fireEvent.change(target, { target: { value: action.value } });
  }
  await waitFor(() => expect(document.querySelector(app.readySelector)).toBeVisible(), { timeout: 4000 });
  for (const text of [...(app.readyText ? [app.readyText] : []), ...(app.readyTexts ?? [])]) {
    expect((await screen.findAllByText(text, { exact: false }, { timeout: 4000 })).length).toBeGreaterThan(0);
  }
}

beforeAll(async () => {
  // Las pantallas lazy se cargan antes: así cada caso entra en su tiempo (tests.md).
  await Promise.all(Object.values(import.meta.glob("../areas/*/*/pages/*Page.tsx")).map((load) => load()));
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("galería de la E9", () => {
  it("cada caso es un estado del tablero vigente, con su viewport, y los ids no se repiten", () => {
    const ids = [...etapa9GalleryCases, ...etapa9GalleryPending].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of etapa9GalleryCases) {
      const choices = boardChoices(entry.board);
      for (const [key, value] of Object.entries(entry.props)) expect.soft(choices[key], `${entry.id}: ${key}=${value}`).toContain(value);
      expect(entry.viewport.width === 390).toBe(entry.board.startsWith("M-"));
    }
    for (const entry of etapa9GalleryPending) expect(entry.reason.length).toBeGreaterThan(0);
  });

  it.each(etapa9GalleryCases.map((entry) => [entry.id, entry] as const))("%s se arma solo con sus respuestas", async (_id, entry) => {
    const restore = entry.viewport.width === 390 ? asPhone() : () => {};
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(entry.app.now) });
    try {
      const { missing, user } = mount(entry.app);
      await run(entry.app, user);
      expect(missing).toEqual([]);
    } finally { vi.useRealTimers(); restore(); }
  }, 10_000);

  it("escribe los casos para capturar-etapa.mjs si se lo piden", () => {
    if (process.env.UPDATE_GALLERY !== "1") return;
    const manifest = { version: 1, stage: "9", issuer, evidence: "API y sesión ficticias para comparación visual; no acredita E2E ni el back.",
      cases: etapa9GalleryCases, pending: etapa9GalleryPending };
    writeFileSync(path.join(root, "scripts/capturas/etapa-9.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  });
});
