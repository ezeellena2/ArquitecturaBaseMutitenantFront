import { Ban } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useSignOut } from "@/auth/useSignOut";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AlertTriangleIcon, BuildingIcon, ClockIcon, LockIcon } from "@/shared/ui/icons";
import type { UnavailableCode } from "@/tenancy/access";
import { AuthStatus, type AuthStatusProps } from "./AuthStatus";

export type BusinessAccessResultProps = (
  | { status: "noBusiness"; organizationName?: never }
  | { status: "inactive" | UnavailableCode; organizationName: string }
) & { onSignedOut?: () => void };

const unavailableResults: Record<UnavailableCode, { title: string; description: string; icon: AuthStatusProps["icon"]; tone: AuthStatusProps["tone"] }> = {
  "Tenancy.Tenant.Suspended": { title: "suspendedTitle", description: "suspendedDescription", icon: AlertTriangleIcon, tone: "warning" },
  "Tenancy.Tenant.PendingApproval": { title: "pendingTitle", description: "pendingDescription", icon: ClockIcon, tone: "brand" },
  "Tenancy.Tenant.Closed": { title: "closedTitle", description: "closedDescription", icon: LockIcon, tone: "neutral" },
};

/// La puerta de empresa que no deja entrar (tablero Ingreso, «Empresa: …»), igual si lo dice el código o si vuelve de
/// authorize: cuenta sin empresa, membresía deshabilitada u organización que todavía no se puede usar.
export function BusinessAccessResult(props: BusinessAccessResultProps) {
  const { t } = useTranslation(["auth", "errors", "common"]);
  const signOut = useSignOut("business");
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const register = <Link to="/registro/empresa">{t("login.registerBusiness")}</Link>;
  const enterAsPerson = <Link to="/login">{t("login.enterAsPerson")}</Link>;
  async function leave() {
    setLeaving(true); setFailure(null);
    if (await signOut()) props.onSignedOut?.(); else setFailure(apiErrorMessage(undefined, t));
    setLeaving(false);
  }
  const exit = props.onSignedOut ? <Button type="button" variant="outline" size="lg" disabled={leaving} onClick={() => { void leave(); }}>{t("common:accessMenu.signOut")}</Button> : null;
  const error = <FormError message={failure} />;

  if (props.status === "noBusiness") return <AuthStatus icon={BuildingIcon} title={t("login.noBusiness")} actions={<>
      <Button asChild size="lg">{register}</Button>
      <Button asChild variant="outline" size="lg">{enterAsPerson}</Button>
      {exit}
    </>}>{error}</AuthStatus>;
  if (props.status === "inactive") return <AuthStatus icon={Ban} title={t("login.inactiveBusiness", { organizationName: props.organizationName })} detail={t("login.askOwner")} actions={<>
      <Button asChild size="lg">{enterAsPerson}</Button>
      <Button asChild variant="outline" size="lg">{register}</Button>
      {exit}
    </>}>{error}</AuthStatus>;
  const unavailable = unavailableResults[props.status];
  return <AuthStatus icon={unavailable.icon} tone={unavailable.tone}
    title={t(`errors:errorPage.unavailable.${unavailable.title}`, { organizationName: props.organizationName })}
    detail={t(`errors:errorPage.unavailable.${unavailable.description}`)}
    actions={<><Button asChild size="lg">{enterAsPerson}</Button>{exit}</>}>{error}</AuthStatus>;
}
