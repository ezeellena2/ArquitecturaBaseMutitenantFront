import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { ApiError } from "./ApiError";
import { api, configureHttpClient, resetHttpClient } from "./httpClient";
import type { PagedResult } from "./pagedResult";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("httpClient", () => {
  beforeEach(() => resetHttpClient());
  afterEach(async () => {
    resetHttpClient();
    await changeCulture("es-AR");
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

    const page = await api.get<PagedResult<{ id: string }>>("/api/items");
    expect(page.items[0].id).toBe("first");
    expect(page.pageSize).toBe(10);
    expect(page.totalCount).toBe(1);
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
});
