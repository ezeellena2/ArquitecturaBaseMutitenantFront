import { ApiError } from "./ApiError";
import { isProblemDetails, type ProblemDetails } from "./problemDetails";
import { effectiveCulture } from "@/shared/i18n";
import { resetServerClock, synchronizeServerClock } from "@/shared/time/serverClock";

interface HttpClientOptions {
  getAccessToken?: () => string | undefined;
  renewAccessToken?: () => Promise<string | undefined>;
  onSessionExpired?: () => Promise<void> | void;
}

const defaults: HttpClientOptions = {};
let options: HttpClientOptions = defaults;
let notifiedExpiredToken: string | undefined;
let renewalInFlight: Promise<string | undefined> | undefined;
let lastRenewal: { previousToken: string; renewedToken: string } | undefined;

export function configureHttpClient(next: HttpClientOptions): void {
  options = { ...defaults, ...next };
}

export function resetHttpClient(): void {
  resetServerClock();
  options = defaults;
  notifiedExpiredToken = undefined;
  renewalInFlight = undefined;
  lastRenewal = undefined;
}

function currentOrRenewedToken(previousToken: string, renew: () => Promise<string | undefined>): Promise<string | undefined> {
  const current = options.getAccessToken?.();
  if (current && current !== previousToken) return Promise.resolve(current);
  if (lastRenewal?.previousToken === previousToken) return Promise.resolve(lastRenewal.renewedToken);
  if (renewalInFlight) return renewalInFlight;

  const pending = Promise.resolve().then(renew).then((renewedToken) => {
    if (renewedToken) lastRenewal = { previousToken, renewedToken };
    return renewedToken;
  }).finally(() => {
    if (renewalInFlight === pending) renewalInFlight = undefined;
  });
  renewalInFlight = pending;
  return pending;
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    const body: unknown = await response.json();

    return isProblemDetails(body) ? body : {};
  } catch (error) {
    if (isAbortError(error)) throw error;
    return {};
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

// Cancela solo la espera de este caller; la renovación compartida sigue para los demás.
function waitForRenewal(pending: Promise<string | undefined>, signal?: AbortSignal | null): Promise<string | undefined> {
  signal?.throwIfAborted();
  if (!signal) return pending;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    pending.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function throwTransportError(error: unknown, signal?: AbortSignal | null): never {
  signal?.throwIfAborted();
  if (isAbortError(error)) throw error;
  throw ApiError.network();
}

async function send(path: string, init: RequestInit, token: string | undefined, cookieOnly = false): Promise<Response> {
  init.signal?.throwIfAborted();
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  } else if (cookieOnly) {
    headers.delete("authorization");
  }

  // La cultura efectiva, la misma de los textos y los formatos (resolveCulture).
  const language = effectiveCulture();

  if (language && !headers.has("accept-language")) {
    headers.set("accept-language", language);
  }

  if (init.body instanceof FormData) {
    // El navegador agrega el boundary; un Content-Type heredado lo rompería.
    headers.delete("content-type");
  } else if (typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });
  synchronizeServerClock(response.headers.get("date"));
  return response;
}

async function receive(path: string, init: RequestInit, allowNotModified = false,
  cookieOnly = false): Promise<Response> {
  init.signal?.throwIfAborted();
  let response: Response;
  const token = cookieOnly ? undefined : options.getAccessToken?.();

  try {
    response = await send(path, init, token, cookieOnly);
  } catch (error) {
    throwTransportError(error, init.signal);
  }

  init.signal?.throwIfAborted();

  if (response.status === 401 && token && options.renewAccessToken && notifiedExpiredToken !== token) {
    let renewedToken: string | undefined;
    try {
      renewedToken = await waitForRenewal(currentOrRenewedToken(token, options.renewAccessToken), init.signal);
    } catch (error) {
      init.signal?.throwIfAborted();
      if (isAbortError(error)) throw error;
      // El 401 original conserva su código y traceId si la sesión ya no se puede renovar.
    }
    init.signal?.throwIfAborted();
    if (renewedToken) {
      try {
        response = await send(path, init, renewedToken, cookieOnly);
      } catch (error) {
        throwTransportError(error, init.signal);
      }
    } else if (options.onSessionExpired && notifiedExpiredToken !== token) {
      notifiedExpiredToken = token;
      try {
        await options.onSessionExpired();
      } catch {
        // Conserva el ProblemDetails original aunque falle la salida de la sesión.
      }
    }
  }

  init.signal?.throwIfAborted();

  // Solo transporta: qué pantalla muestra un 403 lo decide la consulta que lo pidió (queryClient).
  if (!response.ok && !(allowNotModified && response.status === 304)) {
    const problem = await readProblem(response);
    init.signal?.throwIfAborted();
    const retryAfter = response.headers.get("retry-after");
    const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined;
    throw new ApiError(response.status, typeof seconds === "number" && Number.isFinite(seconds)
      ? { ...problem, retryAfter: seconds } : problem);
  }

  return response;
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  // Un 202 sin cuerpo (el reenvío de una invitación) puede llegar sin `Content-Length`, según el servidor y lo que haya
  // en el medio: se lee el texto y un cuerpo vacío es "sin resultado", no un JSON roto.
  const text = await response.text();

  return (text === "" ? undefined : JSON.parse(text)) as T;
}

async function request<T>(path: string, init: RequestInit = {}, cookieOnly = false): Promise<T> {
  return readBody<T>(await receive(path, init, false, cookieOnly));
}

async function getWithMetadata<T>(path: string, init: RequestInit = {}) {
  const response = await receive(path, { ...init, method: "GET" }, true);
  return {
    data: response.status === 304 ? undefined : await readBody<T>(response),
    etag: response.headers.get("etag"),
    notModified: response.status === 304,
  };
}

export const api = {
  // SSE y binarios reciben la misma autenticación/errores sin consumir el cuerpo.
  response: (path: string, init: RequestInit = {}) => receive(path, init),
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
  getWithMetadata,
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", body }),
  postCookie: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" }, true),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
};
