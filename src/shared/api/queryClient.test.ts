import { MutationObserver, type QueryMeta } from "@tanstack/react-query";
import { toast } from "sonner";
import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { ApiError } from "./ApiError";
import { getAccessError } from "./accessErrorStore";
import { createQueryClient, queryClient } from "./queryClient";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function failQuery(key: string, error: ApiError, meta?: { silent: boolean }): Promise<ApiError> {
  const caught = await queryClient.fetchQuery({
    queryKey: [key],
    queryFn: () => Promise.reject(error),
    retry: false,
    meta,
  }).catch((failure: unknown) => failure);
  expect(caught).toBe(error);
  return caught as ApiError;
}

describe("queryClient", () => {
  it("limita también los reintentos de errores inesperados", () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(retry).toBeTypeOf("function");
    if (typeof retry !== "function") throw new Error("retry debe ser función");
    expect(retry(0, new Error("unexpected"))).toBe(true);
    expect(retry(2, new Error("unexpected"))).toBe(false);
  });

  it.each([401, 403])("no muestra toast para %i", async (status) => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery(`status-${status}`, new ApiError(status, { code: `Http.${status}` }));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("respeta meta.silent cuando la pantalla maneja el error", async () => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery("silent", new ApiError(500, { code: "General.Unexpected", traceId: "trace-silent" }), { silent: true });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("muestra un error de red con acción Reintentar", async () => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery("network", ApiError.network());

    expect(toastError).toHaveBeenCalledWith(
      i18n.t("network", { ns: "errors" }),
      expect.objectContaining({
        action: expect.objectContaining({ label: i18n.t("actions.retry") }),
        duration: Number.POSITIVE_INFINITY,
        closeButton: true,
      }),
    );
  });

  it("muestra el aviso 5xx y permite copiar el traceId sin exponerlo en pantalla", async () => {
    const toastError = vi.spyOn(toast, "error");
    const toastSuccess = vi.spyOn(toast, "success");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await failQuery("server", new ApiError(500, {
      code: "General.Unexpected", detail: "Detalle interno", traceId: "trace-abc-123",
    }));

    expect(toastError).toHaveBeenCalledWith(i18n.t("server", { ns: "errors" }), expect.objectContaining({
      action: expect.objectContaining({ label: i18n.t("copyCode", { ns: "errors" }) }),
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    }));
    const options = toastError.mock.calls.find(([message]) => message === i18n.t("server", { ns: "errors" }))?.[1] as unknown as { action: { onClick: () => void | Promise<void> }; description?: string };
    expect(options.description).toBeUndefined();
    await options.action.onClick();
    expect(writeText).toHaveBeenCalledWith("trace-abc-123");
    expect(toastSuccess).toHaveBeenCalledWith(i18n.t("codeCopied", { ns: "errors" }));
  });

  it("muestra un 429 sin reintento automático y conserva retryAfterSeconds", async () => {
    const toastError = vi.spyOn(toast, "error");
    const call = vi.fn(async () => {
      throw new ApiError(429, { code: "Http.TooManyRequests", retryAfter: 42, detail: "Esperá." });
    });
    const caught = await queryClient.fetchQuery({ queryKey: ["limited"], queryFn: call }).catch((error: unknown) => error);

    expect(call).toHaveBeenCalledTimes(1);
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).retryAfterSeconds).toBe(42);
    expect(toastError).toHaveBeenCalledWith(i18n.t("rateLimited", { ns: "errors" }), expect.objectContaining({
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    }));
  });

  it("muestra el detail ya traducido de un error de negocio", async () => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery("business", new ApiError(409, { code: "Users.Email.AlreadyTaken", detail: "Ese correo ya está en uso." }));
    expect(toastError).toHaveBeenCalledWith("Ese correo ya está en uso.", expect.objectContaining({
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    }));
  });
});

// F1: el cliente HTTP solo transporta; la pantalla «sin permiso» la decide la consulta que lo declara en `meta`.
describe("bloqueo de la vista por un 403", () => {
  async function failWith(error: ApiError, meta?: QueryMeta): Promise<void> {
    const client = createQueryClient({ queries: { retry: false } });
    await client.fetchQuery({ queryKey: ["vista"], queryFn: () => Promise.reject(error), meta }).catch(() => undefined);
  }

  it("lo publica cuando viene de la consulta principal de la pantalla", async () => {
    const error = new ApiError(403, { code: "Authorization.Forbidden" });
    await failWith(error, { silent: true, blocksView: true });
    expect(getAccessError()).toBe(error);
  });

  it("no lo publica cuando viene de una consulta secundaria", async () => {
    await failWith(new ApiError(403, { code: "Authorization.Forbidden" }), { silent: true });
    expect(getAccessError()).toBeNull();
  });

  it("los términos nuevos siguen su camino desde cualquier consulta o mutación", async () => {
    const fromQuery = new ApiError(403, { code: "Legal.AcceptanceRequired" });
    await failWith(fromQuery, { silent: true });
    expect(getAccessError()).toBe(fromQuery);

    const fromMutation = new ApiError(403, { code: "Legal.AcceptanceRequired" });
    const client = createQueryClient();
    await new MutationObserver(client, { mutationFn: () => Promise.reject(fromMutation) }).mutate().catch(() => undefined);
    expect(getAccessError()).toBe(fromMutation);
  });

  it("deja el 403 de una mutación en su formulario", async () => {
    const client = createQueryClient();
    await new MutationObserver(client, { mutationFn: () => Promise.reject(new ApiError(403, { code: "Authorization.Forbidden" })) })
      .mutate().catch(() => undefined);
    expect(getAccessError()).toBeNull();
  });
});
