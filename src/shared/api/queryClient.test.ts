import { toast } from "sonner";
import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { ApiError } from "./ApiError";
import { queryClient } from "./queryClient";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
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
      expect.objectContaining({ action: expect.objectContaining({ label: i18n.t("actions.retry") }) }),
    );
  });

  it("muestra el texto genérico de 5xx y el traceId, sin exponer detail", async () => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery("server", new ApiError(500, {
      code: "General.Unexpected", detail: "Detalle interno", traceId: "trace-abc-123",
    }));

    expect(toastError).toHaveBeenCalledWith(i18n.t("server", { ns: "errors" }), {
      description: i18n.t("traceId", { ns: "errors", traceId: "trace-abc-123" }),
    });
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
    expect(toastError).toHaveBeenCalledWith(i18n.t("rateLimited", { ns: "errors" }));
  });

  it("muestra el detail ya traducido de un error de negocio", async () => {
    const toastError = vi.spyOn(toast, "error");
    await failQuery("business", new ApiError(409, { code: "Users.Email.AlreadyTaken", detail: "Ese correo ya está en uso." }));
    expect(toastError).toHaveBeenCalledWith("Ese correo ya está en uso.");
  });
});
