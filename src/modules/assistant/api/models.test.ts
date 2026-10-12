import { expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { fetchAssistantModels } from "./models";

it("conserva los metadatos publicados aunque no coincidan con un cálculo local", async () => {
  const published = { items: [], page: 3, pageSize: 10, totalCount: 24, totalPages: 7, hasPrevious: false, hasNext: true };
  server.use(http.get("/api/platform/assistant/models", () => HttpResponse.json(published)));
  expect(await fetchAssistantModels({ page: 3, pageSize: 10 })).toEqual(published);
});
it("no inventa los metadatos opcionales del catálogo", async () => {
  const published = { items: [], page: 3, pageSize: 10, totalCount: 24 };
  server.use(http.get("/api/platform/assistant/models", () => HttpResponse.json(published)));
  expect(await fetchAssistantModels({ page: 3, pageSize: 10 })).toEqual(published);
});
