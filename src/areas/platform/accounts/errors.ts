import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";

const inviteFields = {
  "Platform.Operator.InvitationExists": { field: "email", key: "invite.invitationExists" },
  "Platform.Operator.AccountExists": { field: "email", key: "invite.accountExists" },
  "Platform.Operator.PermissionsRequired": { field: "permissions", key: "invite.permissionsRequired" },
} as const;
export function operatorInvitationError(error: unknown, t: TFunction): { field: "email" | "permissions"; message: string } | null {
  if (!(error instanceof ApiError)) return null;
  const rejected = Object.entries(inviteFields).find(([code]) => code === error.code)?.[1];
  return rejected ? { field: rejected.field, message: t(`platformAccounts:${rejected.key}`) } : null;
}
/** La baja personal tiene otra voz; Plataforma conserva el código y traduce sólo estos dos textos. */
export function accountActionError(error: unknown, t: TFunction, soleOwners: readonly string[] = []): unknown {
  if (!(error instanceof ApiError)) return error;
  const detail = error.code === "Legal.AccountDeletion.AlreadyPending" ? t("platformAccounts:errors.alreadyPending")
    : error.code === "Legal.AccountDeletion.LastAdmin" && soleOwners.length ? t("platformAccounts:confirm.deletion.soleOwner", { organization: soleOwners.join(", ") }) : null;
  return detail ? new ApiError(error.status, { ...error.problem, detail }, error.isNetworkError) : error;
}
export const accountStateConflictCodes = ["Users.User.InvalidTransition", "Legal.AccountDeletion.AlreadyPending", "Legal.AccountDeletion.LastAdmin", "Platform.Operator.NoPendingInvitation"] as const;
