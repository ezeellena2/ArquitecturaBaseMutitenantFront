import { ApiError } from "@/shared/api/ApiError";

/** Lectura pura: StrictMode puede evaluar el inicializador dos veces. */
export function loginLinkToken(fragment: string): string | null {
  const token = new URLSearchParams(fragment.replace(/^#/u, "")).get("t");
  return token || null;
}

export function stripLoginLinkFragment(): void {
  if (globalThis.location.hash) globalThis.history.replaceState(globalThis.history.state, "", `${globalThis.location.pathname}${globalThis.location.search}`);
}

export function loginLinkErrorState(error: unknown): "invalid" | "suspended" | "retry" {
  if (error instanceof ApiError && error.code === "Identity.Account.Suspended") return "suspended";
  if (error instanceof ApiError && ["Auth.LoginLink.Invalid", "Auth.LoginLink.Expired", "Auth.LoginLink.AlreadyUsed", "Validation.Failed"].includes(error.code ?? "")) return "invalid";
  return "retry";
}

export function publicWhatsAppUrl(phone: string | null | undefined): string | null {
  return phone && /^\+[1-9]\d{1,14}$/u.test(phone) ? `https://wa.me/${phone.slice(1)}` : null;
}
