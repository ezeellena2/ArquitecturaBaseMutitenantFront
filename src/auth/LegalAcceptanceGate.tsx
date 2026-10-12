import { useEffect, useState } from "react";
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
  const { data, isPending, isFetching, isError, refetch } = useCurrentUser();
  const accessError = useAccessError();
  const blocked = accessError?.code === accountErrorCodes.legalAcceptanceRequired;
  const [legalReadFor, setLegalReadFor] = useState<typeof accessError>(null);
  useEffect(() => {
    if (!blocked) return;
    let current = true;
    // La aceptación no puede recibir el Me anterior: pending=[] la devolvería a la ruta bloqueada.
    void queryClient.invalidateQueries({ queryKey: currentUserQueryKey }).then(() => { if (current) setLegalReadFor(accessError); });
    return () => { current = false; };
  }, [accessError, blocked, queryClient]);
  if (isPending || (blocked && (legalReadFor !== accessError || isFetching))) return <p role="status" className="p-6">{t("states.loading")}</p>;
  // «Criterio · Avisos» (Pantalla de error): sin /api/me no se puede mostrar nada; «Reintentar» lo vuelve a pedir.
  if (!data || (blocked && isError)) return <LoadErrorPage standalone onRetry={() => { void refetch(); }} />;
  if (blocked || (data.pendingLegalDocuments?.length ?? 0) > 0) return <Navigate to={accountPagePaths.acceptLegal} state={{ returnTo: location.pathname + location.search }} replace />;
  return <Outlet />;
}
