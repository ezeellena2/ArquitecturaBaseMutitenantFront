import type { MeResponse } from "@/shared/api/types";
import { currentUsers, type CurrentUserFixture } from "../../../test/mocks/currentUsers.ts";
import { platformWhatsAppPermissions, whatsappPermissions } from "../access.ts";

// Galería de la E11 (scripts/capturas/etapa-11.json): contratos reales y datos ficticios del arnés. No acredita el back ni
// Meta: la app se fotografía con estas respuestas y se compara con su tablero.

export interface GalleryApiResponse {
  method: "GET" | "POST" | "PUT" | "DELETE"; path: string; status: number; body?: unknown;
  rawBody?: string; contentType?: string; query?: Record<string, string>; afterResponse?: { method: "POST" | "PUT" | "DELETE"; path: string };
}
export type GalleryAction = { type: "click" | "press" | "fill"; role?: "button" | "radio" | "combobox" | "textbox" | "option" | "menuitem" | "link" | "tab";
  name?: string; label?: string; exact?: boolean; key?: string; value?: string; within?: { role: "complementary" | "dialog"; name: string } };
export interface GalleryApp {
  path: string; captureMode: "harness"; site: "main"; userFixture: CurrentUserFixture;
  responses: GalleryApiResponse[]; actions: GalleryAction[]; readySelector: string; readyText?: string; readyTexts?: string[]; now: string;
}
export interface GalleryCase {
  id: string; group: string; board: string; state: string; stateKey: string; props: Record<string, string>;
  viewport: { width: 1440 | 390; height: 900 | 844 }; label: string; captureExtent: "viewport"; app: GalleryApp;
}
export interface GalleryPending {
  id: string; group: string; board: string; viewport: GalleryCase["viewport"]; label: string; reason: string;
}

export type GalleryScope = "business" | "platform" | "consumer";
const fixtureByScope = { business: "visual-owner", platform: "visual-operator", consumer: "visual-personal" } as const satisfies Record<GalleryScope, CurrentUserFixture>;

/** La hora de los tableros de la E11: martes 13/10/2026, 11:00 en Buenos Aires. */
export const galleryNow = "2026-10-13T14:00:00Z";

export const api = (method: GalleryApiResponse["method"], path: string, body?: unknown, status = 200, query?: Record<string, string>): GalleryApiResponse =>
  ({ method, path, status, ...(body === undefined ? {} : { body }), ...(query ? { query } : {}) });
export const click = (name: string, role: NonNullable<GalleryAction["role"]> = "button", within?: GalleryAction["within"]): GalleryAction =>
  ({ type: "click", role, name, exact: true, ...(within ? { within } : {}) });
/** Abre un desplegable de Radix con el teclado (tests.md): el clic de jsdom no siempre lo abre. */
export const press = (name: string, role: NonNullable<GalleryAction["role"]> = "button", key = "Enter"): GalleryAction => ({ type: "press", role, name, exact: true, key });
export const fill = (name: string, value: string, within?: GalleryAction["within"]): GalleryAction =>
  ({ type: "fill", role: "textbox", name, value, exact: true, ...(within ? { within } : {}) });

/** /api/me del arnés con el módulo prendido y los permisos de WhatsApp (todos, o los que se pidan). */
export function galleryMe(scope: GalleryScope, permissions?: readonly string[]): MeResponse {
  const base = currentUsers[fixtureByScope[scope]];
  if (scope === "platform") {
    return { ...base, effectivePermissions: { ...base.effectivePermissions, platform: [...base.effectivePermissions.platform, ...(permissions ?? platformWhatsAppPermissions)] } };
  }
  const organization = scope === "business" ? [...base.effectivePermissions.organization, ...(permissions ?? whatsappPermissions)] : [];
  return { ...base, features: [...new Set([...base.features, "whatsapp"])], permissions: organization,
    effectivePermissions: { ...base.effectivePermissions, organization } };
}

/** El marco: /api/me y el contador del menú (CC09 en la organización; los conteos de Consultas en Plataforma). */
function frame(scope: GalleryScope, me: MeResponse, untaken: number): GalleryApiResponse[] {
  return [api("GET", "/api/me", me),
    ...(scope === "business" ? [api("GET", "/api/organization/whatsapp/untaken", { customers: untaken, internal: 0 })] : []),
    ...(scope === "platform" ? [api("GET", "/api/platform/whatsapp/conversations", {
      conversations: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false },
      counts: { customers: 0, internal: 0, untaken } }, 200, { pageSize: "10" })] : [])];
}

/**
 * Una pantalla de la app en el arnés visual: las respuestas propias van primero (la primera que coincide gana) y después
 * las del marco. `readySelector` es lo que tiene que verse para fotografiar; `readyText`, un texto que lo confirma.
 */
export function galleryApp(scope: GalleryScope, route: string, responses: GalleryApiResponse[], options: {
  me?: MeResponse; actions?: GalleryAction[]; readySelector?: string; readyText?: string; readyTexts?: string[]; untaken?: number; now?: string;
} = {}): GalleryApp {
  const userFixture = fixtureByScope[scope];
  const me = options.me ?? galleryMe(scope);
  return {
    path: `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: userFixture, route })}`, captureMode: "harness", site: "main", userFixture,
    now: options.now ?? galleryNow, actions: options.actions ?? [], readySelector: options.readySelector ?? "main",
    ...(options.readyText ? { readyText: options.readyText } : {}), ...(options.readyTexts ? { readyTexts: options.readyTexts } : {}),
    responses: [...responses, ...frame(scope, me, options.untaken ?? 2)],
  };
}

const slug = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const viewportOf = (board: string): GalleryCase["viewport"] => board.startsWith("M-") ? { width: 390, height: 844 } : { width: 1440, height: 900 };

/** Un caso: el tablero en su estado (`stateKey` del control Tweak del tablero) y la app que se le compara. */
export function galleryCase(group: string, board: string, state: string, app: GalleryApp, options: { stateKey?: string; props?: Record<string, string>; id?: string } = {}): GalleryCase {
  const stateKey = options.stateKey ?? "estado";
  return { id: options.id ?? slug(`${board}-${state}`), group, board, state, stateKey, props: options.props ?? { [stateKey]: state },
    viewport: viewportOf(board), label: state, captureExtent: "viewport", app };
}

/** Lo que todavía no se fotografía, con su motivo: un estado que el lienzo no dibujó, o que el arnés no puede armar. */
export function galleryPending(group: string, board: string, state: string, reason: string): GalleryPending {
  return { id: slug(`${board}-${state}`), group, board, viewport: viewportOf(board), label: state, reason };
}

/** Un `PagedResult` de una sola página. */
export const page = <T,>(items: readonly T[], totalCount = items.length) =>
  ({ items: [...items], page: 1, pageSize: 10, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / 10)), hasPrevious: false, hasNext: totalCount > 10 });
