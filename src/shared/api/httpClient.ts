import { ApiError } from "./ApiError";
import { isProblemDetails, type ProblemDetails } from "./problemDetails";
import { effectiveCulture } from "@/shared/i18n";

interface HttpClientOptions {
  getAccessToken?: () => string | undefined;
  getCulture?: () => string | null | undefined;
  renewAccessToken?: () => Promise<string | undefined>;
}

const defaults: HttpClientOptions = {};
let options: HttpClientOptions = defaults;

export function configureHttpClient(next: HttpClientOptions): void {
  options = { ...defaults, ...next };
}

export function resetHttpClient(): void {
  options = defaults;
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    const body: unknown = await response.json();

    return isProblemDetails(body) ? body : {};
  } catch {
    return {};
  }
}

async function send(path: string, init: RequestInit, token: string | undefined): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const language = options.getCulture?.() ?? effectiveCulture();

  if (language && !headers.has("accept-language")) {
    headers.set("accept-language", language);
  }

  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return fetch(path, { ...init, headers });
}

async function receive(path: string, init: RequestInit, allowNotModified = false): Promise<Response> {
  let response: Response;
  const token = options.getAccessToken?.();

  try {
    response = await send(path, init, token);
  } catch {
    throw ApiError.network();
  }

  if (response.status === 401 && token && options.renewAccessToken) {
    let renewedToken: string | undefined;
    try {
      renewedToken = await options.renewAccessToken();
    } catch {
      // El 401 original conserva su código y traceId si la sesión ya no se puede renovar.
    }
    if (renewedToken) {
      try {
        response = await send(path, init, renewedToken);
      } catch {
        throw ApiError.network();
      }
    }
  }

  if (!response.ok && !(allowNotModified && response.status === 304)) {
    throw new ApiError(response.status, await readProblem(response));
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return readBody<T>(await receive(path, init));
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
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
  getWithMetadata,
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
};
