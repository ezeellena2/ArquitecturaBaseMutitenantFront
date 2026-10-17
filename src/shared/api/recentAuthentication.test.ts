import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "i18next";
import { server } from "@/test/mocks/server";
import { actionErrorMessage, apiErrorMessage } from "./errorMessage";
import { api } from "./httpClient";
import { isReauthenticationCancelled, registerRecentAuthenticationHost, settleRecentAuthentication } from "./recentAuthentication";

const required = () => HttpResponse.json({ code: "Auth.Platform.ReauthenticationRequired" }, { status: 403 });
let release: (() => void) | undefined;
afterEach(() => { settleRecentAuthentication(false); release?.(); release = undefined; });

describe("el cliente HTTP ante «Confirmá que sos vos»", () => {
  it("sin el diálogo montado (fuera de Plataforma) el 403 llega igual", async () => {
    server.use(http.post("/api/platform/settings-test", () => required()));
    await expect(api.post("/api/platform/settings-test", { value: 1 })).rejects.toMatchObject({ status: 403, code: "Auth.Platform.ReauthenticationRequired" });
  });

  it("dos escrituras a la vez esperan una sola confirmación y cada una se repite una vez, con su clave", async () => {
    release = registerRecentAuthenticationHost();
    const seen: string[] = [];
    server.use(http.post("/api/platform/write/:id", ({ params, request }) => {
      seen.push(`${String(params.id)}:${request.headers.get("Idempotency-Key")}`);
      return seen.filter((entry) => entry.startsWith(`${String(params.id)}:`)).length === 1 ? required() : HttpResponse.json({ id: params.id });
    }));
    const first = api.post("/api/platform/write/a", {}, { headers: { "Idempotency-Key": "key-a" } });
    const second = api.post("/api/platform/write/b", {}, { headers: { "Idempotency-Key": "key-b" } });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(seen).toEqual(["a:key-a", "b:key-b"]);
    settleRecentAuthentication(true);
    await expect(first).resolves.toEqual({ id: "a" });
    await expect(second).resolves.toEqual({ id: "b" });
    expect(seen.slice(2).sort()).toEqual(["a:key-a", "b:key-b"]);
  });

  it("cancelar rechaza sin un error que se muestre y no repite el pedido", async () => {
    release = registerRecentAuthenticationHost();
    let calls = 0;
    server.use(http.put("/api/platform/write", () => { calls++; return required(); }));
    const write = api.put("/api/platform/write", {});
    await new Promise((resolve) => setTimeout(resolve, 50));
    settleRecentAuthentication(false);
    const error = await write.catch((caught: unknown) => caught);
    expect(isReauthenticationCancelled(error)).toBe(true);
    expect(actionErrorMessage(error, i18n.t)).toBeNull();
    expect(apiErrorMessage(error, i18n.t)).toBe("");
    expect(calls).toBe(1);
  });

  it("el pedido que confirma no espera a otra confirmación", async () => {
    release = registerRecentAuthenticationHost();
    server.use(http.post("/api/platform/reauthentication", () => required()));
    await expect(api.post("/api/platform/reauthentication", { method: "authenticator", code: "123456" })).rejects.toMatchObject({ status: 403 });
  });
});
