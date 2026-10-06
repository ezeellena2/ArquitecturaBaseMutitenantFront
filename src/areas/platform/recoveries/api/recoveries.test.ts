import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { changeRecovery, fetchRecoveries, fetchRecoveryCounts } from "./recoveries";

describe("Contrato HTTP de Recuperaciones", () => {
  it("pagina, busca y filtra en servidor; conteos conservan la búsqueda y el estado", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/platform/recoveries/paged", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ items: [] }); }),
      http.get("/api/platform/recoveries/filter-counts", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ total: 0, statuses: [] }); }));
    await fetchRecoveries({ page: 2, pageSize: 50, sort: "-createdAt", search: "Pablo & Rosa", status: "Pending" });
    await fetchRecoveryCounts({ search: "Pablo & Rosa", status: "Pending" });
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ page: "2", pageSize: "50", sort: "-createdAt", search: "Pablo & Rosa", status: "Pending" });
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ search: "Pablo & Rosa", status: "Pending" });
  });
  it.each(["approve", "reject"] as const)("%s manda versión, motivo y clave; devuelve la versión propia", async (action) => {
    let body: unknown; let key: string | null = null;
    server.use(http.post(`/api/platform/recoveries/request%2F1/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 37 }); }));
    expect(await changeRecovery("request/1", action, { version: 12, reason: "Revisión" }, "recovery-key")).toEqual({ version: 37 });
    expect(body).toEqual({ version: 12, reason: "Revisión" }); expect(key).toBe("recovery-key");
  });
});
