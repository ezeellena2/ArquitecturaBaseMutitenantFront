import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import type { AssistantUsagePageResponse } from "@/shared/api/types";
import { assistantUsageQueryKey, fetchAssistantUsage } from "./usage";
import type { AssistantScope } from "./assistant";

const scope: AssistantScope = { access: "business", tenantId: "organization-a", userId: "person-a" };
const page: AssistantUsagePageResponse = { month: "2026-10", cost: { amount: 77.125, currency: "USD" }, totalQueries: 1284, peopleCount: 9,
  budgetProgress: null, organizationCount: null, rows: { items: [], page: 1, pageSize: 20, totalCount: 0 } };
describe("Uso agregado publicado", () => {
  it("Business envía mes, agrupación y paginado exactos y conserva la respuesta", async () => {
    let url: URL | undefined;
    server.use(http.get("/api/organization/assistant/usage", ({ request }) => { url = new URL(request.url); return HttpResponse.json(page); }));
    expect(await fetchAssistantUsage(scope, { month: "2026-10", groupBy: "person", page: 3, pageSize: 50 })).toEqual(page);
    expect(Object.fromEntries(url!.searchParams)).toEqual({ month: "2026-10", groupBy: "person", page: "3", pageSize: "50" });
  });
  it("Platform nunca manda groupBy ni identidad a la API", async () => {
    let query: Record<string, string> | undefined;
    server.use(http.get("/api/platform/assistant/usage", ({ request }) => { query = Object.fromEntries(new URL(request.url).searchParams); return HttpResponse.json(page); }));
    await fetchAssistantUsage({ ...scope, access: "platform", tenantId: null }, { month: "2026-10", groupBy: "day", page: 1, pageSize: 20 });
    expect(query).toEqual({ month: "2026-10", page: "1", pageSize: "20" });
  });
  it("las claves separan actor, acceso, organización, mes y agrupación", () => {
    const query = { month: "2026-10", groupBy: "day", page: 1, pageSize: 20 } as const;
    const key = assistantUsageQueryKey(scope, query);
    for (const other of [{ ...scope, userId: "person-b" }, { ...scope, tenantId: "organization-b" }, { ...scope, access: "platform" as const }]) {
      expect(assistantUsageQueryKey(other, query)).not.toEqual(key);
    }
    expect(assistantUsageQueryKey(scope, { ...query, month: "2026-09" })).not.toEqual(key);
    expect(assistantUsageQueryKey(scope, { ...query, groupBy: "person" })).not.toEqual(key);
  });
  it("no transforma 501 en un mes vacío ni 403 en permiso de chat", async () => {
    server.use(http.get("/api/organization/assistant/usage", () => HttpResponse.json({ code: "General.Contract.NotImplemented" }, { status: 501 })));
    await expect(fetchAssistantUsage(scope, { month: "2026-10" })).rejects.toMatchObject({ status: 501, code: "General.Contract.NotImplemented" });
  });
  it("propaga la cancelación de la lectura privada", async () => {
    server.use(http.get("/api/organization/assistant/usage", () => HttpResponse.json(page)));
    const controller = new AbortController(); controller.abort();
    await expect(fetchAssistantUsage(scope, { month: "2026-10" }, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
