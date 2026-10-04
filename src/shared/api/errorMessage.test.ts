import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { ApiError } from "./ApiError";
import { actionErrorMessage, apiErrorMessage, isGenericApiError, toastActionError } from "./errorMessage";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const t = i18n.t;

afterEach(() => vi.restoreAllMocks());

describe("apiErrorMessage", () => {
  // Criterio · Avisos: «No pudimos …» y qué hacer; nunca el message crudo («HTTP 0») ni códigos técnicos.
  it.each([
    ["sin conexión", ApiError.network(), "No pudimos conectarnos. Revisá tu conexión."],
    ["un 5xx, aunque traiga detail", new ApiError(500, { code: "General.Unexpected", detail: "NullReferenceException", traceId: "t-1" }), "Algo salió mal. Probá de nuevo en un rato."],
    ["un 429 sin detail", new ApiError(429, { code: "Http.TooManyRequests", retryAfter: 42 }), "Hiciste muchos pedidos seguidos. Probá de nuevo en unos segundos."],
    ["un 429 con el motivo del back", new ApiError(429, { code: "Auth.LoginCode.ResendTooSoon", detail: "Esperá para pedir otro código." }), "Esperá para pedir otro código."],
    ["un error de negocio, con el detail que tradujo el back", new ApiError(409, { code: "Roles.Role.AlreadyExists", detail: "Ya existe un rol con ese nombre." }), "Ya existe un rol con ese nombre."],
    ["un 4xx sin detail", new ApiError(400, { code: "Validation.Failed" }), "Algo salió mal. Probá de nuevo en un rato."],
    ["un error que no es de la API", new Error("validation"), "Algo salió mal. Probá de nuevo en un rato."],
  ])("da el texto de %s", (_case, error, expected) => {
    expect(apiErrorMessage(error, t)).toBe(expected);
  });
});

describe("isGenericApiError", () => {
  it("reconoce red, 5xx y 429, que se avisan igual en cualquier pantalla", () => {
    expect(isGenericApiError(ApiError.network())).toBe(true);
    expect(isGenericApiError(new ApiError(503, {}))).toBe(true);
    expect(isGenericApiError(new ApiError(429, {}))).toBe(true);
    expect(isGenericApiError(new ApiError(409, { code: "General.ConcurrencyConflict" }))).toBe(false);
    expect(isGenericApiError(new Error("x"))).toBe(false);
  });
});

describe("actionErrorMessage", () => {
  // El mismo error nunca va en dos lugares: si ya lo avisó el MutationCache, la pantalla no lo repite.
  it("no repite lo que ya avisó el MutationCache y da el texto de lo demás", () => {
    expect(actionErrorMessage(ApiError.network(), t)).toBeNull();
    expect(actionErrorMessage(new ApiError(502, {}), t)).toBeNull();
    expect(actionErrorMessage(new ApiError(429, {}), t)).toBeNull();
    expect(actionErrorMessage(new ApiError(409, { detail: "Ya existe un rol con ese nombre." }), t)).toBe("Ya existe un rol con ese nombre.");
    expect(actionErrorMessage(undefined, t)).toBeNull();
  });
});

describe("toastActionError", () => {
  it("avisa abajo el error de negocio de una acción y deja los genéricos al MutationCache", () => {
    const toastError = vi.spyOn(toast, "error");
    toastActionError(new ApiError(409, { code: "Companies.Membership.LastCompanyAdmin", detail: "Es el último Administrador." }), t);
    toastActionError(ApiError.network(), t);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("Es el último Administrador.", expect.objectContaining({ duration: Number.POSITIVE_INFINITY, closeButton: true }));
  });
});
