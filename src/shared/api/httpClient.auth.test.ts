import { HttpResponse, http } from "msw";
import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { ApiError } from "./ApiError";
import { api, configureHttpClient, resetHttpClient } from "./httpClient";

afterEach(() => resetHttpClient());

describe("httpClient con sesión", () => {
  it("renueva el token tras 401 y repite una sola vez la misma petición", async () => {
    const seen: string[] = [];
    server.use(http.post("/api/protected", async ({ request }) => {
      seen.push(`${request.headers.get("authorization")}:${await request.text()}:${request.headers.get("idempotency-key")}`);
      return seen.length === 1
        ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ ok: true });
    }));
    const renewAccessToken = vi.fn(async () => "new-token");
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken });

    await expect(api.post("/api/protected", { value: 7 }, { headers: { "idempotency-key": "same-key" } }))
      .resolves.toEqual({ ok: true });
    expect(renewAccessToken).toHaveBeenCalledOnce();
    expect(seen).toEqual([
      'Bearer old-token:{"value":7}:same-key',
      'Bearer new-token:{"value":7}:same-key',
    ]);
  });

  it("comparte una sola renovación entre dos respuestas 401 simultáneas", async () => {
    const seen: string[] = [];
    server.use(http.get("/api/protected", ({ request }) => {
      const authorization = request.headers.get("authorization") ?? "";
      seen.push(authorization);
      return authorization === "Bearer old-token"
        ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ ok: true });
    }));
    let releaseRenewal = (_token: string): void => {};
    const renewal = new Promise<string>((resolve) => { releaseRenewal = resolve; });
    const renewAccessToken = vi.fn(() => renewal);
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken });

    const first = api.get("/api/protected");
    const second = api.get("/api/protected");
    await waitFor(() => expect(seen.filter((token) => token === "Bearer old-token")).toHaveLength(2));
    releaseRenewal("new-token");

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(renewAccessToken).toHaveBeenCalledOnce();
    expect(seen.filter((token) => token === "Bearer new-token")).toHaveLength(2);
  });

  it("reintenta un 401 tardío con el token que otra petición ya renovó", async () => {
    let releaseLate = (): void => {};
    const lateResponse = new Promise<void>((resolve) => { releaseLate = resolve; });
    let currentToken = "old-token";
    const seen: string[] = [];
    server.use(http.get("/api/:kind", async ({ params, request }) => {
      const authorization = request.headers.get("authorization") ?? "";
      seen.push(`${params.kind}:${authorization}`);
      if (params.kind === "late" && authorization === "Bearer old-token") await lateResponse;
      return authorization === "Bearer old-token"
        ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ ok: true });
    }));
    const renewAccessToken = vi.fn(async () => {
      currentToken = "new-token";
      return currentToken;
    });
    configureHttpClient({ getAccessToken: () => currentToken, renewAccessToken });

    const late = api.get("/api/late");
    await expect(api.get("/api/early")).resolves.toEqual({ ok: true });
    releaseLate();

    await expect(late).resolves.toEqual({ ok: true });
    expect(renewAccessToken).toHaveBeenCalledOnce();
    expect(seen).toContain("late:Bearer new-token");
  });

  it("notifica una sola expiración cuando fallan dos renovaciones concurrentes", async () => {
    server.use(http.get("/api/protected", () => HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })));
    let releaseRenewal = (): void => {};
    const renewal = new Promise<undefined>((resolve) => { releaseRenewal = () => resolve(undefined); });
    const renewAccessToken = vi.fn(() => renewal);
    const onSessionExpired = vi.fn(async () => {});
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken, onSessionExpired });

    const first = api.get("/api/protected").catch((error: unknown) => error);
    const second = api.get("/api/protected").catch((error: unknown) => error);
    await waitFor(() => expect(renewAccessToken).toHaveBeenCalled());
    releaseRenewal();
    const errors = await Promise.all([first, second]);

    expect(errors).toEqual([expect.objectContaining({ status: 401 }), expect.objectContaining({ status: 401 })]);
    expect(renewAccessToken).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("entrega el segundo 401 sin volver a renovar", async () => {
    let calls = 0;
    server.use(http.get("/api/protected", () => {
      calls += 1;
      return HttpResponse.json({ code: "Http.Unauthorized", traceId: "trace-401" }, { status: 401 });
    }));
    const renewAccessToken = vi.fn(async () => "new-token");
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken });

    const error = await api.get("/api/protected").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, traceId: "trace-401" });
    expect(calls).toBe(2);
    expect(renewAccessToken).toHaveBeenCalledOnce();
  });

  it("si falla la renovación conserva el 401 original y no reintenta", async () => {
    let calls = 0;
    server.use(http.get("/api/protected", () => {
      calls += 1;
      return HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 });
    }));
    const renewAccessToken = vi.fn(async () => { throw new Error("login_required"); });
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken });

    const error = await api.get("/api/protected").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401 });
    expect(calls).toBe(1);
    expect(renewAccessToken).toHaveBeenCalledOnce();
  });

  it("avisa una sola vez que la sesión venció cuando la renovación no entrega token", async () => {
    server.use(http.get("/api/protected", () => HttpResponse.json({
      code: "Http.Unauthorized", traceId: "trace-expired",
    }, { status: 401 })));
    const onSessionExpired = vi.fn(async () => {});
    configureHttpClient({
      getAccessToken: () => "old-token",
      renewAccessToken: async () => undefined,
      onSessionExpired,
    });

    await expect(api.get("/api/protected")).rejects.toMatchObject({ status: 401, traceId: "trace-expired" });
    await expect(api.get("/api/protected")).rejects.toMatchObject({ status: 401, traceId: "trace-expired" });
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("también avisa si la renovación lanza invalid_grant", async () => {
    server.use(http.get("/api/protected", () => HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })));
    const onSessionExpired = vi.fn(async () => {});
    configureHttpClient({
      getAccessToken: () => "old-token",
      renewAccessToken: async () => { throw new Error("invalid_grant"); },
      onSessionExpired,
    });

    await expect(api.get("/api/protected")).rejects.toMatchObject({ status: 401 });
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("no intenta renovar una petición anónima", async () => {
    server.use(http.get("/api/protected", () => HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })));
    const renewAccessToken = vi.fn(async () => "new-token");
    configureHttpClient({ renewAccessToken });

    await expect(api.get("/api/protected")).rejects.toMatchObject({ status: 401 });
    expect(renewAccessToken).not.toHaveBeenCalled();
  });
});
