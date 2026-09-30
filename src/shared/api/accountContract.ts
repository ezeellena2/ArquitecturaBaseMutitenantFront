import type { PendingDeletionState } from "./types";
import type { ProblemDetails } from "./problemDetails";

export const accountPaths = {
  me: "/api/me",
  methods: "/api/me/login-methods",
  method: "/api/me/login-methods/{methodId}",
  methodCode: "/api/me/login-methods/{methodId}/code",
  methodVerify: "/api/me/login-methods/{methodId}/verify",
  methodPrimary: "/api/me/login-methods/{methodId}/primary",
  reauth: "/api/me/reauth",
  reauthVerify: "/api/me/reauth/verify",
  google: "/api/me/external/google",
  acceptLegal: "/api/legal/accept",
  deletion: "/api/me/deletion",
  pendingDeletion: "/api/auth/deletion/pending",
  cancelDeletion: "/api/auth/deletion/cancel",
} as const;

export const accountPagePaths = { account: "/cuenta", acceptLegal: "/aceptar-terminos", login: "/login", businessLogin: "/login/empresa" } as const;
export const accountErrorCodes = {
  pendingDeletion: "Identity.Account.PendingDeletion",
  legalAcceptanceRequired: "Legal.AcceptanceRequired",
  graceExpired: "Legal.AccountDeletion.GraceExpired",
  concurrency: "General.ConcurrencyConflict",
} as const;

export const methodPath = (template: string, methodId: string) => template.replace("{methodId}", encodeURIComponent(methodId));

/** Solo la metadata de una prueba válida permite mostrar la cancelación de la baja. */
export function pendingDeletionFromProblem(problem: ProblemDetails): PendingDeletionState | null {
  if (problem.code !== accountErrorCodes.pendingDeletion) return null;
  const scheduledForUtc = problem["scheduledForUtc"];
  const cancelTicket = problem["cancelTicket"];
  const timeZoneId = problem["timeZoneId"];
  const returnUrl = problem["returnUrl"];
  const expiresAtUtc = problem["cancelTicketExpiresAtUtc"];
  if (typeof scheduledForUtc !== "string" || typeof cancelTicket !== "string" || typeof timeZoneId !== "string"
    || typeof returnUrl !== "string" || typeof expiresAtUtc !== "string") return null;
  return { scheduledForUtc, cancelTicket, timeZoneId, returnUrl, expiresAtUtc };
}
