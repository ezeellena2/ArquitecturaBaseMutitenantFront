import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { accountQueryKey, accountsQueryRoot, changeAccount, fetchAccount, fetchAccountCounts, fetchAccounts } from "./accounts";
import { changeOperatorPermissions, inviteOperator, removeOperator, resendOperatorInvitation, revokeOperatorInvitation } from "./operators";

describe("Contrato HTTP de Cuentas", () => {
  it("PUT y DELETE operador llevan cuerpo version/motivo y clave; sólo PUT responde versión", async () => {
    const received: { body: unknown; key: string | null }[] = [];
    server.use(http.put("/api/platform/accounts/account%2F1/operator", async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); return HttpResponse.json({ version: 7 }); }),
      http.delete("/api/platform/accounts/account%2F1/operator", async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); return new HttpResponse(null, { status: 204 }); }));
    expect(await changeOperatorPermissions("account/1", { version: 6, reason: "Revisión", permissions: ["platform.accounts.read"] }, "put-key")).toEqual({ version: 7 });
    expect(await removeOperator("account/1", { version: 7, reason: "Fin" }, "delete-key")).toBeUndefined();
    expect(received).toEqual([{ body: { version: 6, reason: "Revisión", permissions: ["platform.accounts.read"] }, key: "put-key" }, { body: { version: 7, reason: "Fin" }, key: "delete-key" }]);
  });
  it("pagina, ordena y busca en servidor; conteos cruzados sin paginado", async () => {
    const urls: URL[] = [];
    server.use(http.get("/api/platform/accounts/paged", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ items: [], page: 2, pageSize: 50, totalCount: 0, totalPages: 0, hasPrevious: true, hasNext: false }); }), http.get("/api/platform/accounts/filter-counts", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json({ total: 0, states: [], kinds: [] }); }));
    await fetchAccounts({ page: 2, pageSize: 50, sort: "-lastSignInAtUtc", search: "Lucía & Hijos", kind: "Person", state: "Suspended" });
    await fetchAccountCounts({ search: "Lucía & Hijos", kind: "Person", state: "Suspended" });
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ page: "2", pageSize: "50", sort: "-lastSignInAtUtc", search: "Lucía & Hijos", kind: "Person", state: "Suspended" });
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ search: "Lucía & Hijos", kind: "Person", state: "Suspended" });
  });
  it("detalle usa id opaco escapado y raíz común", async () => {
    server.use(http.get("/api/platform/accounts/account%2F1", () => HttpResponse.json({ id: "account/1", soleOwnerOrganizations: ["Delta"] })));
    expect(await fetchAccount("account/1")).toMatchObject({ id: "account/1", soleOwnerOrganizations: ["Delta"] });
    expect(accountQueryKey("account/1")).toEqual([...accountsQueryRoot, "detail", "account/1"]);
  });
  it.each(["suspend", "reactivate", "revoke-sessions", "deletion"] as const)("%s manda sólo motivo y clave; 204 no tiene versión", async (action) => {
    let body: unknown; let key: string | null = null;
    server.use(http.post(`/api/platform/accounts/account%2F1/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return new HttpResponse(null, { status: 204 }); }));
    expect(await changeAccount("account/1", action, { reason: "Revisión" }, "account-key")).toBeUndefined(); expect(body).toEqual({ reason: "Revisión" }); expect(key).toBe("account-key");
  });
  it("Invitar conserva email/permisos, Reenviar sólo clave y Revocar DELETE sin cuerpo ni clave", async () => {
    const received: { method: string; key: string | null; body: string }[] = [];
    const capture = async (request: Request) => { received.push({ method: request.method, key: request.headers.get("Idempotency-Key"), body: await request.text() }); };
    server.use(http.post("/api/platform/operators/invitations", async ({ request }) => { await capture(request); return HttpResponse.json({ id: "account/1", expiresAtUtc: "2026-10-04T12:00:00Z" }, { status: 201 }); }), http.post("/api/platform/operators/account%2F1/invitation/resend", async ({ request }) => { await capture(request); return HttpResponse.json({ id: "account/1", expiresAtUtc: "2026-10-08T12:00:00Z" }); }), http.delete("/api/platform/operators/account%2F1/invitation", async ({ request }) => { await capture(request); return new HttpResponse(null, { status: 204 }); }));
    await inviteOperator({ email: "nuevo@example.com", permissions: [] }, "invite-key"); await resendOperatorInvitation("account/1", "resend-key"); await revokeOperatorInvitation("account/1");
    expect(JSON.parse(received[0].body)).toEqual({ email: "nuevo@example.com", permissions: [] }); expect(received[0].key).toBe("invite-key");
    expect(received.slice(1)).toEqual([{ method: "POST", key: "resend-key", body: "" }, { method: "DELETE", key: null, body: "" }]);
  });
});
