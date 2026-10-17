import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { File as FetchFile } from "node:buffer";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { ApiError } from "./ApiError";
import { api, configureHttpClient, resetHttpClient } from "./httpClient";
import type { ResourceOptions } from "./resourceOptions";
import { getAccessError } from "./accessErrorStore";
import { now } from "@/shared/time/serverClock";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

// P2 (E9): un 429 llega una vez, con la espera que pidió el servidor; el cliente nunca lo repite solo.
it("un límite de uso llega con su espera, sin repetir el pedido", async () => {
  let calls = 0;
  server.use(http.post("/api/limited", () => { calls++; return HttpResponse.json({ code: "Security.RateLimit.Exceeded", retryAfter: 41 }, { status: 429, headers: { "Retry-After": "41" } }); }));
  const error = await api.post("/api/limited", {}).catch((caught: unknown) => caught);
  expect(error).toMatchObject({ status: 429, code: "Security.RateLimit.Exceeded", retryAfterSeconds: 41 });
  expect(calls).toBe(1);
});

describe("httpClient", () => {
  beforeEach(() => resetHttpClient());
  afterEach(async () => {
    vi.unstubAllGlobals();
    resetHttpClient();
    await changeCulture("es-AR");
  });

  it.each([200, 429])("sincroniza el reloj HTTP en una respuesta %i antes de entregar datos o errores", async (status) => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2036-10-12T12:00:00Z"));
    vi.spyOn(performance, "now").mockReturnValue(100);
    server.use(http.get("/api/clock-test", () => HttpResponse.json({ code: "Http.TooManyRequests" }, {
      status, headers: { Date: "Mon, 12 Oct 2026 12:00:00 GMT" },
    })));
    try {
      if (status === 200) await api.get("/api/clock-test");
      else await expect(api.get("/api/clock-test")).rejects.toBeInstanceOf(ApiError);
      expect(now()).toBe(Date.parse("2026-10-12T12:00:00Z"));
    } finally { vi.restoreAllMocks(); }
  });

  // F1: qué pantalla muestra un 403 lo decide la consulta (queryClient), no el transporte.
  it("solo transporta: un 403 llega con su ProblemDetails y no cambia la pantalla", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json({ code: "Tenancy.Tenant.Suspended", organizationName: "Beta S.R.L.", tenantId: "beta" }, { status: 403 })),
      http.put("/api/me", () => HttpResponse.json({ code: "Legal.AcceptanceRequired", traceId: "test" }, { status: 403 })),
    );

    await expect(api.get("/api/me")).rejects.toMatchObject({ status: 403, code: "Tenancy.Tenant.Suspended", problem: { organizationName: "Beta S.R.L.", tenantId: "beta" } });
    await expect(api.put("/api/me", {})).rejects.toMatchObject({ status: 403, code: "Legal.AcceptanceRequired", traceId: "test" });
    expect(getAccessError()).toBeNull();
  });

  it("envía Bearer solo cuando hay token y conserva los headers del caller", async () => {
    const seen: Array<{ authorization: string | null; etag: string | null }> = [];
    server.use(http.get("/api/test-client", ({ request }) => {
      seen.push({
        authorization: request.headers.get("authorization"),
        etag: request.headers.get("if-none-match"),
      });
      return HttpResponse.json({ ok: true });
    }));

    await api.get("/api/test-client", { headers: { "if-none-match": "abc" } });
    configureHttpClient({ getAccessToken: () => "secret-token" });
    await api.get("/api/test-client");

    expect(seen).toEqual([
      { authorization: null, etag: "abc" },
      { authorization: "Bearer secret-token", etag: null },
    ]);
  });

  it("manda Accept-Language con la cultura efectiva completa", async () => {
    await changeCulture("en-US");
    let language: string | null = null;
    server.use(http.get("/api/test-client", ({ request }) => {
      language = request.headers.get("accept-language");
      return HttpResponse.json({ ok: true });
    }));

    await api.get("/api/test-client");
    expect(language).toBe("en-US");
  });

  it("respeta Accept-Language explícito para consultar el catálogo predeterminado", async () => {
    let language: string | null = null;
    server.use(http.get("/api/test-client", ({ request }) => {
      language = request.headers.get("accept-language");
      return HttpResponse.json({ ok: true });
    }));

    await api.get("/api/test-client", { headers: { "accept-language": "und" } });
    expect(language).toBe("und");
  });

  it("devuelve ETag y permite 304 sin cuerpo en una lectura condicional", async () => {
    server.use(http.get("/api/test-client", ({ request }) => request.headers.get("if-none-match")
      ? new HttpResponse(null, { status: 304, headers: { etag: "v1" } })
      : HttpResponse.json({ ok: true }, { headers: { etag: "v1" } })));

    await expect(api.getWithMetadata<{ ok: boolean }>("/api/test-client")).resolves.toEqual({
      data: { ok: true }, etag: "v1", notModified: false,
    });
    await expect(api.getWithMetadata<{ ok: boolean }>("/api/test-client", {
      headers: { "if-none-match": "v1" },
    })).resolves.toEqual({ data: undefined, etag: "v1", notModified: true });
  });

  it("expone ProblemDetails con retryAfterSeconds y errores por campo", async () => {
    server.use(http.post("/api/test-client", () => HttpResponse.json({
      status: 429,
      code: "Http.TooManyRequests",
      detail: "Esperá un momento.",
      traceId: "trace-429",
      retryAfter: 42,
      errors: { name: ["Escribí un nombre."] },
    }, { status: 429, headers: { "content-type": "application/problem+json" } })));

    const caught = await api.post("/api/test-client", { name: "" }).catch((error: unknown) => error);
    expect(caught).toBeInstanceOf(ApiError);
    const error = caught as ApiError;
    expect(error).toMatchObject({ status: 429, code: "Http.TooManyRequests", detail: "Esperá un momento.", traceId: "trace-429" });
    expect(error.retryAfterSeconds).toBe(42);
    expect(error.errors).toEqual({ name: ["Escribí un nombre."] });
  });

  it("mantiene tipado el contrato paginado", async () => {
    server.use(http.get("/api/items", () => HttpResponse.json({
      items: [{ id: "first" }], page: 1, pageSize: 10, totalCount: 1,
      totalPages: 1, hasPrevious: false, hasNext: false,
    })));

    const page = await api.get<Awaited<ReturnType<ResourceOptions<{ id: string }>["queryFn"]>>>("/api/items");
    expect(page.items[0].id).toBe("first");
    expect(page.pageSize).toBe(10);
    expect(page.totalCount).toBe(1);
  });

  it("transporta Retry-After aunque el error de teléfono no lo repita en el cuerpo", async () => {
    server.use(http.post("/api/test-client", () => HttpResponse.json({
      code: "Http.TooManyRequests", errors: { phone: ["Esperá un momento."] },
    }, { status: 429, headers: { "Retry-After": "35" } })));
    await expect(api.post("/api/test-client", {})).rejects.toMatchObject({
      retryAfterSeconds: 35, errors: { phone: ["Esperá un momento."] },
    });
  });

  it("devuelve el 401 como ApiError si todavía no hay Auth", async () => {
    server.use(http.get("/api/protected", () => HttpResponse.json({
      code: "Http.Unauthorized", detail: "Ingresá de nuevo.", traceId: "trace-401",
    }, { status: 401 })));

    const caught = await api.get("/api/protected").catch((error: unknown) => error);
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({ status: 401, code: "Http.Unauthorized", traceId: "trace-401" });
  });

  it("convierte una falla de red en ApiError", async () => {
    server.use(http.get("/api/test-client", () => HttpResponse.error()));
    const caught = await api.get("/api/test-client").catch((error: unknown) => error);
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({ status: 0, isNetworkError: true });
  });

  it("respeta Accept SSE y devuelve el cuerpo binario sin consumirlo", async () => {
    let accept: string | null = null;
    server.use(http.get("/api/stream", ({ request }) => {
      accept = request.headers.get("accept");
      return new HttpResponse("event: done\ndata: {}\n\n", { headers: { "content-type": "text/event-stream" } });
    }));
    const response = await api.response("/api/stream", { headers: { Accept: "text/event-stream, application/json" } });
    expect(accept).toBe("text/event-stream, application/json");
    expect(response.bodyUsed).toBe(false);
    expect(await response.text()).toContain("event: done");
  });

  it("deja al navegador el boundary de FormData y conserva sus campos y Bearer", async () => {
    let seen: unknown;
    server.use(http.post("/api/upload", async ({ request }) => {
      const body = await request.formData();
      seen = { contentType: request.headers.get("content-type"), authorization: request.headers.get("authorization"),
        version: body.get("conversationVersion"), file: (body.get("file") as File).name };
      return HttpResponse.json({ ok: true });
    }));
    configureHttpClient({ getAccessToken: () => "private-token" });
    // Fetch de Node requiere su FormData nativo; JSDOM usa otra implementación de Blob/File.
    vi.stubGlobal("File", FetchFile);
    const form = await new Request("http://localhost/form", { method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=fixture" },
      body: '--fixture\r\nContent-Disposition: form-data; name="file"; filename="image.png"\r\nContent-Type: image/png\r\n\r\nbytes\r\n--fixture\r\nContent-Disposition: form-data; name="conversationVersion"\r\n\r\n7\r\n--fixture--\r\n',
    }).formData();
    vi.stubGlobal("FormData", form.constructor);
    await expect(api.postForm("/api/upload", form, { headers: { "Content-Type": "application/json" } })).resolves.toEqual({ ok: true });
    expect(seen).toEqual({ contentType: expect.stringMatching(/^multipart\/form-data; boundary=/),
      authorization: "Bearer private-token", version: "7", file: "image.png" });
  });

  it("abortar antes de enviar conserva AbortError y no envía ni renueva", async () => {
    const handler = vi.fn(() => HttpResponse.json({ ok: true }));
    server.use(http.get("/api/abort", handler));
    const renewAccessToken = vi.fn(async () => "new-token");
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken });
    const controller = new AbortController();
    controller.abort();
    await expect(api.get("/api/abort", { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(handler).not.toHaveBeenCalled();
    expect(renewAccessToken).not.toHaveBeenCalled();
  });

  it("abortar durante fetch conserva AbortError", async () => {
    const controller = new AbortController();
    let release = (): void => {};
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const handler = vi.fn(async () => { await pending; return HttpResponse.json({ ok: true }); });
    server.use(http.get("/api/abort", handler));
    const result = api.get("/api/abort", { signal: controller.signal }).catch((error: unknown) => error);
    await waitFor(() => expect(handler).toHaveBeenCalledOnce());
    controller.abort();
    expect(await result).toMatchObject({ name: "AbortError" });
    release();
  });

  it.each(["new-token", undefined])("cancelar la espera no cancela la renovación compartida (%s) ni expira al caller", async (renewedToken) => {
    const seen: string[] = [];
    server.use(http.get("/api/renew-abort", ({ request }) => {
      const authorization = request.headers.get("authorization") ?? "";
      seen.push(authorization);
      return authorization === "Bearer old-token"
        ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 }) : HttpResponse.json({ ok: true });
    }));
    let release = (_token: string | undefined): void => {};
    const renewal = new Promise<string | undefined>((resolve) => { release = resolve; });
    const renewAccessToken = vi.fn(() => renewal);
    const onSessionExpired = vi.fn();
    configureHttpClient({ getAccessToken: () => "old-token", renewAccessToken, onSessionExpired });
    const controller = new AbortController();
    const canceled = api.get("/api/renew-abort", { signal: controller.signal }).catch((error: unknown) => error);
    await waitFor(() => expect(renewAccessToken).toHaveBeenCalledOnce());
    controller.abort();
    // Debe terminar antes de que la renovación compartida responda.
    expect(await canceled).toMatchObject({ name: "AbortError" });
    expect(onSessionExpired).not.toHaveBeenCalled();
    const active = api.get("/api/renew-abort").catch((error: unknown) => error);
    await waitFor(() => expect(seen).toHaveLength(2));
    release(renewedToken);
    expect(await active).toMatchObject(renewedToken ? { ok: true } : { status: 401 });
    expect(seen.filter((token) => token === "Bearer new-token")).toHaveLength(renewedToken ? 1 : 0);
    expect(renewAccessToken).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledTimes(renewedToken ? 0 : 1);
  });
});
