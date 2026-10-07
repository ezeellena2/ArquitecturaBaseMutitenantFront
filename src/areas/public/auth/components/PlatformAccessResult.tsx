import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useSignOut } from "@/auth/useSignOut";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { BuildingIcon } from "@/shared/ui/icons";
import { homeOf } from "@/tenancy/access";
import { AuthStatus } from "./AuthStatus";

// Ingreso/M-Ingreso: estado privado «Operador: la cuenta entra por Plataforma», después de probar el correo.
export function PlatformAccessResult({ access, onSignedOut, platformHref = homeOf("platform") }: {
  access: "consumer" | "business"; onSignedOut: () => void; platformHref?: string;
}) {
  const { t } = useTranslation(["auth", "common", "errors"]);
  const signOut = useSignOut(access);
  const [leaving, setLeaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function leave() {
    setLeaving(true);
    setFailure(null);
    if (await signOut()) onSignedOut();
    else setFailure(apiErrorMessage(undefined, t));
    setLeaving(false);
  }

  return <AuthStatus icon={BuildingIcon} title={t("login.platformOnly")} actions={<>
    <Button asChild size="lg"><Link to={platformHref}>{t("login.goToPlatform")}</Link></Button>
    <Button type="button" variant="outline" size="lg" disabled={leaving} onClick={() => { void leave(); }}>{t("common:accessMenu.signOut")}</Button>
  </>}>
    <FormError message={failure} />
  </AuthStatus>;
}
