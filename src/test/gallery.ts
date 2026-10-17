import type { CurrentUserFixture } from "./mocks/currentUsers";

// Las piezas de una galería de etapa (scripts/capturas/etapa-N.json): cada caso es un estado de un tablero y la app que se
// le compara, armada en el arnés visual con respuestas ficticias. No acredita el back: la app se fotografía con estas
// respuestas. Es la misma forma que usa la galería de la E11 en su módulo.

export interface GalleryApiResponse {
  method: "GET" | "POST" | "PUT" | "DELETE"; path: string; status: number; body?: unknown; query?: Record<string, string>;
  afterResponse?: { method: "POST" | "PUT" | "DELETE"; path: string };
}
export type GalleryAction = { type: "click" | "press" | "fill" | "otp" | "scroll";
  role?: "button" | "checkbox" | "textbox" | "menuitem" | "menuitemcheckbox" | "combobox" | "option" | "link" | "tab";
  name?: string; label?: string; exact?: boolean; key?: string; value?: string; within?: { role: "dialog" | "alertdialog"; name: string };
  /** Cuál de los que se llaman igual, desde 0: Roles tiene tres «Solo lectura», uno por empresa. */
  nth?: number;
  /** `scroll`: dónde queda el control, como lo muestra el tablero. */
  block?: "start" | "center" };
/** Un paso sobre el tablero antes de fotografiarlo (capturar-etapa.mjs, runBoardActions): un clic por selector CSS. */
export type GalleryBoardAction = { type: "click"; selector: string };
export interface GalleryApp {
  path: string; captureMode: "harness"; site: "main"; userFixture: CurrentUserFixture | "anonymous";
  responses: GalleryApiResponse[]; actions: GalleryAction[]; readySelector: string; readyText?: string; readyTexts?: string[]; now: string;
}
export interface GalleryCase {
  id: string; group: string; board: string; state: string; stateKey: string; props: Record<string, string>;
  viewport: { width: 1440 | 390; height: 900 | 844 }; label: string; captureExtent: "viewport"; app: GalleryApp;
  boardActions?: GalleryBoardAction[];
}
export interface GalleryPending {
  id: string; group: string; board: string; viewport: GalleryCase["viewport"]; label: string; reason: string;
}

export const api = (method: GalleryApiResponse["method"], path: string, body?: unknown, status = 200, query?: Record<string, string>): GalleryApiResponse =>
  ({ method, path, status, ...(body === undefined ? {} : { body }), ...(query ? { query } : {}) });
export const click = (name: string, role: NonNullable<GalleryAction["role"]> = "button", within?: GalleryAction["within"]): GalleryAction =>
  ({ type: "click", role, name, exact: true, ...(within ? { within } : {}) });
/** Abre un desplegable de Radix con el teclado (tests.md): el clic de jsdom no siempre lo abre. */
export const press = (name: string, role: NonNullable<GalleryAction["role"]> = "button", key = "Enter", nth?: number): GalleryAction =>
  ({ type: "press", role, name, exact: true, key, ...(nth === undefined ? {} : { nth }) });
export const fill = (name: string, value: string, within?: GalleryAction["within"]): GalleryAction =>
  ({ type: "fill", role: "textbox", name, value, exact: true, ...(within ? { within } : {}) });
/** Sin nombre, la pantalla vuelve arriba; con nombre, ese control queda a la vista donde lo pone el tablero. */
export const scroll = (name?: string, role: NonNullable<GalleryAction["role"]> = "textbox", block: NonNullable<GalleryAction["block"]> = "center"): GalleryAction =>
  name ? { type: "scroll", role, name, exact: true, block } : { type: "scroll" };
/** El código de seis números desde la primera casilla, como lo escribe una persona. */
export const otp = (value: string): GalleryAction => ({ type: "otp", value });

/** La app en el arnés visual (`etapa8VisualApp.html`): las respuestas van en orden y la primera que coincide gana. */
export function galleryApp(userFixture: GalleryApp["userFixture"], route: string, responses: GalleryApiResponse[], options: {
  actions?: GalleryAction[]; readySelector?: string; readyText?: string; readyTexts?: string[]; now: string;
}): GalleryApp {
  return {
    path: `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: userFixture, route })}`, captureMode: "harness", site: "main", userFixture,
    now: options.now, actions: options.actions ?? [], readySelector: options.readySelector ?? "main",
    ...(options.readyText ? { readyText: options.readyText } : {}), ...(options.readyTexts ? { readyTexts: options.readyTexts } : {}), responses,
  };
}

const slug = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const viewportOf = (board: string): GalleryCase["viewport"] => board.startsWith("M-") ? { width: 390, height: 844 } : { width: 1440, height: 900 };

/** Un caso: el tablero en su estado (`stateKey` del control Tweak) y la app que se le compara. */
export function galleryCase(group: string, board: string, state: string, app: GalleryApp,
  options: { stateKey?: string; props?: Record<string, string>; id?: string; boardActions?: GalleryBoardAction[] } = {}): GalleryCase {
  const stateKey = options.stateKey ?? "estado";
  return { id: options.id ?? slug(`${board}-${state}`), group, board, state, stateKey, props: options.props ?? { [stateKey]: state },
    viewport: viewportOf(board), label: state, captureExtent: "viewport", app, ...(options.boardActions ? { boardActions: options.boardActions } : {}) };
}

/** Lo que todavía no se fotografía, con su motivo: un estado que el lienzo no publicó o una tarea que falta programar. */
export function galleryPending(group: string, board: string, state: string, reason: string): GalleryPending {
  return { id: slug(`${board}-${state}`), group, board, viewport: viewportOf(board), label: state, reason };
}
