import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { ApiError } from "@/shared/api/ApiError";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { homeOf } from "@/tenancy/access";
import { AssistantWorkspace } from "../components/AssistantWorkspace";
import { useAssistantSession } from "../hooks/useAssistantSession";
import type { AssistantHomeProps } from "./assistantHomeProps";
export type { AssistantHomeProps } from "./assistantHomeProps";

export function AssistantHome(props: AssistantHomeProps) {
  if (!props.enabled) return null;
  return <AssistantSession key={`${props.scope.access}:${props.scope.tenantId}:${props.scope.userId}`} {...props} />;
}

function AssistantSession(props: AssistantHomeProps) {
  const { t } = useTranslation("assistant");
  const session = useAssistantSession(props);
  const { operations, unavailable, runtime, scope, selectedId, state } = session;
  if (!operations.active || unavailable && props.onUnavailable) return null;
  const error = runtime.state.error ?? runtime.detail.error;
  if (error instanceof ApiError && error.status === 403) return <ForbiddenPage homePath={homeOf(scope.access)} />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage homePath={homeOf(scope.access)} />;
  if (error) return <AssistantCoreStatus {...props} title={t("title")} status={<LoadErrorPage screen={t("title")} onRetry={() => { void runtime.state.refetch(); if (selectedId) void runtime.detail.refetch(); }} />} />;
  if (!state) return <AssistantCoreStatus {...props} title={t("title")} status={<p role="status">{t("loading")}</p>} />;
  return <AssistantWorkspace props={props} session={session} state={state} />;
}

function AssistantCoreStatus({ title, banner, welcome, children: core, status }: { title: string; banner?: ReactNode; welcome?: ReactNode; children?: ReactNode; status?: ReactNode }) {
  // El núcleo conserva su bienvenida y pendientes mientras State espera o falla.
  if (!core && !welcome && !banner) return status;
  return <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto">{banner}{welcome}<section aria-label={title}>{status}</section>{core}</div>;
}
