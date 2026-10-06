import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";

export const recoveryStateConflictCodes = ["Platform.AccountRecovery.AlreadyResolved"] as const;
export function recoveryActionError(error: unknown, t: TFunction): unknown {
  if (!(error instanceof ApiError)) return error;
  const key = error.code === "Platform.AccountRecovery.NoAccount" ? "noAccount"
    : error.code === "Platform.AccountRecovery.MethodInUse" ? "methodInUse"
      : error.code === "Platform.AccountRecovery.MethodAlreadyOnAccount" ? "methodAlreadyOnAccount"
        : error.code === "Platform.AccountRecovery.OperatorAccount" ? "operatorAccount"
          : error.code === "Platform.AccountRecovery.AlreadyResolved" ? "alreadyResolved"
            : error.code === "Platform.AccountRecovery.NotFound" ? "notFound" : null;
  return key ? new ApiError(error.status, { ...error.problem, detail: t(`platformRecoveries:errors.${key}`) }, error.isNetworkError) : error;
}
