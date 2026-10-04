import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAccessError } from "@/shared/api/accessErrorStore";
import { accountErrorCodes, accountPagePaths } from "@/shared/api/accountContract";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { currentUserQueryKey, useCurrentUser } from "./useCurrentUser";

export function LegalAcceptanceGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data, isPending, refetch } = useCurrentUser();
  const accessError = useAccessError();
  const blocked = accessError?.code === accountErrorCodes.legalAcceptanceRequired;
  useEffect(() => { if (blocked) void queryClient.invalidateQueries({ queryKey: currentUserQueryKey }); }, [blocked, queryClient]);
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  // «Criterio · Avisos» (Pantalla de error): sin /api/me no se puede mostrar nada; «Reintentar» lo vuelve a pedir.
  if (!data) return <main className="flex min-h-dvh flex-col bg-[var(--fondo)]"><LoadErrorPage onRetry={() => { void refetch(); }} /></main>;
  if (blocked || (data.pendingLegalDocuments?.length ?? 0) > 0) return <Navigate to={accountPagePaths.acceptLegal} state={{ returnTo: location.pathname + location.search }} replace />;
  return <Outlet />;
}
