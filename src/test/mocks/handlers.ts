import type { RequestHandler } from "msw";

// E1: cada test declara la respuesta que usa con server.use(...). Los handlers de
// /api/me y autenticación de ArquitecturaBaseFront se incorporan en E3.
export const handlers: RequestHandler[] = [];
