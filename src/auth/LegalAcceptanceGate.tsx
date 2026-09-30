import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAccessError } from "@/shared/api/accessErrorStore";
import { accountErrorCodes, accountPagePaths } from "@/shared/api/accountContract";
import { FormError } from "@/shared/ui/FormError";
import { Button } from "@/shared/ui/button";
import { currentUserQueryKey, useCurrentUser } from "./useCurrentUser";

export function LegalAcceptanceGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useCurrentUser();
  const accessError = useAccessError();
  const blocked = accessError?.code === accountErrorCodes.legalAcceptanceRequired;
  useEffect(() => { if (blocked) void queryClient.invalidateQueries({ queryKey: currentUserQueryKey }); }, [blocked, queryClient]);
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  if (!data) return <div className="p-6"><FormError message={error?.message ?? t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  if (blocked || (data.pendingLegalDocuments?.length ?? 0) > 0) return <Navigate to={accountPagePaths.acceptLegal} state={{ returnTo: location.pathname + location.search }} replace />;
  return <Outlet />;
}
