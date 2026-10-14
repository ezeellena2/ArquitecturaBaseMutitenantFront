import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "@/test/mocks/authContext";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { GalleryApp, GalleryCase } from "./gallery";
import { etapa11GalleryCases, etapa11GalleryPending } from "./etapa11Gallery";

// La galería de la E11 (scripts/capturas/etapa-11.json) sale de los casos de cada área. Este test comprueba que cada caso
// es un estado del tablero vigente y que la app real se arma solo con sus respuestas, sin pedir nada sin responder. Con
// UPDATE_GALLERY=1 vuelve a escribir el archivo de casos que usa `capturar-etapa.mjs --casos scripts/capturas/etapa-11.json`.
const root = path.resolve(import.meta.dirname, "../../../..");
const canvas = path.join(root, "docs/design/lienzo");
const issuer = "http://localtest.me:5192";

function boardChoices(board: string): Record<string, readonly string[]> {
  const html = readFileSync(path.join(canvas, `${board}.dc.html`), "utf8");
  const attribute = html.match(/<script\b[^>]*\bdata-dc-script\b[^>]*\bdata-props='([^']+)'/);
  if (!attribute) return {};
  const props = JSON.parse(attribute[1]) as Record<string, { options?: string[]; default?: string }>;
  return Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith("$")).map(([key, field]) => [key, field.options ?? [field.default ?? ""]]));
}

/** Uso del asistente con el segmentado (F8): los casos de la 8b, que ya tienen sus datos, con el estado de cada vista. */
function assistantUsageCases(): GalleryCase[] {
  const previous = JSON.parse(readFileSync(path.join(root, "scripts/capturas/etapa-8b.json"), "utf8")) as { cases: GalleryCase[] };
  return previous.cases.filter((entry) => (entry.board === "Asistente-Uso-Org" || entry.board === "M-Asistente-Uso-Org")
    && (entry.state === "Por día" || entry.state === "Por persona")).map((entry) => ({ ...entry, group: "asistente" }));
}

function mount(app: GalleryApp) {
  const missing: string[] = [];
  const completed = new Set<string>();
  server.use(http.all("/api/*", ({ request }) => {
    const url = new URL(request.url);
    const response = app.responses.find((item) => item.method === request.method && item.path === url.pathname
      && (!item.afterResponse || completed.has(`${item.afterResponse.method} ${item.afterResponse.path}`))
      && Object.entries(item.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value));
    if (!response) {
      // Como el arnés: el catálogo de referencia lo sirve el fixture común si el caso no lo pisa.
      if (url.pathname === "/api/reference-data") return undefined;
      missing.push(`${request.method} ${url.pathname}${url.search}`);
      return HttpResponse.json({ code: "Capture.UnmockedRoute" }, { status: 501 });
    }
    completed.add(`${response.method} ${response.path}`);
    if (response.status === 204) return new HttpResponse(null, { status: 204 });
    return response.rawBody === undefined ? HttpResponse.json(response.body ?? {}, { status: response.status })
      : new HttpResponse(response.rawBody, { status: response.status, headers: { "Content-Type": response.contentType! } });
  }));
  const route = new URL(app.path, issuer).searchParams.get("route")!;
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  render(<StrictMode><AppProviders client={client} authContext={fixtureAuth(app.userFixture)}><RouterProvider router={router} /></AppProviders></StrictMode>);
  return { missing, user: userEvent.setup() };
}

async function run(app: GalleryApp, user: ReturnType<typeof userEvent.setup>) {
  for (const action of app.actions) {
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
  await Promise.all(Object.values(import.meta.glob("../*/pages/*Page.tsx")).map((load) => load()));
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("galería de la E11", () => {
  const cases = [...etapa11GalleryCases, ...assistantUsageCases()];

  it("cada caso es un estado del tablero vigente, con su viewport, y los ids no se repiten", () => {
    const ids = [...cases, ...etapa11GalleryPending].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of cases) {
      const choices = boardChoices(entry.board);
      for (const [key, value] of Object.entries(entry.props)) expect.soft(choices[key], `${entry.id}: ${key}=${value}`).toContain(value);
      expect(entry.viewport.width === 390).toBe(entry.board.startsWith("M-"));
    }
    for (const entry of etapa11GalleryPending) {
      expect.soft(Object.keys(boardChoices(entry.board)).length, `${entry.id}: el tablero existe`).toBeGreaterThanOrEqual(0);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it.each(etapa11GalleryCases.map((entry) => [entry.id, entry] as const))("%s se arma solo con sus respuestas", async (_id, entry) => {
    const restore = entry.viewport.width === 390 ? asPhone() : () => {};
    // Como capturar-etapa.mjs (context.clock.setFixedTime): la hora del caso, para que la ventana de 24 h sea la del tablero.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(entry.app.now) });
    try {
      const { missing, user } = mount(entry.app);
      await run(entry.app, user);
      expect(missing).toEqual([]);
    } finally { vi.useRealTimers(); restore(); }
  }, 10_000);

  it("escribe los casos para capturar-etapa.mjs si se lo piden", () => {
    if (process.env.UPDATE_GALLERY !== "1") return;
    const manifest = { version: 1, stage: "11", issuer,
      evidence: "API y sesión ficticias para comparación visual; no acredita E2E, el back ni Meta.",
      cases, pending: etapa11GalleryPending };
    writeFileSync(path.join(root, "scripts/capturas/etapa-11.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  });
});
