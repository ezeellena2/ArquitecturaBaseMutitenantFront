import { File as FetchFile } from "node:buffer";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { server } from "@/test/mocks/server";
import type { WhatsAppContactResponse } from "../../api/types";

/// Datos de prueba de Contactos: no son los del tablero (difusiones solo a quien acepta, ningún número de empleado).
export const martina: WhatsAppContactResponse = {
  id: "contact-martina", name: "Martina López", displayNumber: "+5491155556203", tags: ["Mayorista"], consent: "Accepted",
  consentSource: "Bot", consentChangedAtUtc: "2026-09-12T13:00:00Z", linkedToAccount: true, lastConversationAtUtc: "2026-10-01T12:00:00Z", version: 4,
};

export const unnamed: WhatsAppContactResponse = {
  id: "contact-unnamed", name: null, displayNumber: "+5493515550192", tags: [], consent: "NoAnswer",
  consentSource: null, consentChangedAtUtc: null, linkedToAccount: false, lastConversationAtUtc: null, version: 1,
};

export const carla: WhatsAppContactResponse = {
  id: "contact-carla", name: "Carla Ruiz", displayNumber: "+5491155551146", tags: [], consent: "Unsubscribed",
  consentSource: "Unsubscribe", consentChangedAtUtc: "2026-09-29T09:40:00Z", linkedToAccount: false, lastConversationAtUtc: "2026-09-29T09:40:00Z", version: 2,
};

export function paged<T>(items: readonly T[], totalCount = items.length) {
  return { items: [...items], page: 1, pageSize: 10, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / 10)), hasPrevious: false, hasNext: totalCount > 10 };
}

/** El marco pide el contador de Chats; las etiquetas, los filtros y los diálogos. */
export function frameHandlers(tags: readonly string[] = ["Mayorista", "Minorista"]) {
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: null })),
    http.get("/api/organization/whatsapp/contacts/tags", () => HttpResponse.json(paged(tags))),
  );
}

/** jsdom y el `fetch` de Node no comparten `FormData`: el multipart viaja con los de Node, como en los tests del asistente. */
export async function useNativeForms() {
  const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
  vi.stubGlobal("FormData", nativeForm.constructor);
  vi.stubGlobal("File", FetchFile);
}
