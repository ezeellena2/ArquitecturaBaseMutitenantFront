import { Ban, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { AuthStatus } from "./AuthStatus";

export type BusinessAccessResultProps =
  | { status: "noBusiness"; organizationName?: never }
  | { status: "inactive"; organizationName: string };

/// La puerta de empresa que no deja entrar (tablero Ingreso, «Empresa: …»), igual si lo dice el código o si vuelve de
/// authorize: la cuenta no está en ninguna empresa, o su acceso a la organización está deshabilitado.
export function BusinessAccessResult(props: BusinessAccessResultProps) {
  const { t } = useTranslation("auth");
  const register = <Link to="/registro/empresa">{t("login.registerBusiness")}</Link>;
  const enterAsPerson = <Link to="/login">{t("login.enterAsPerson")}</Link>;

  return props.status === "noBusiness"
    ? <AuthStatus icon={Building2} title={t("login.noBusiness")} actions={<>
      <Button asChild size="lg">{register}</Button>
      <Button asChild variant="outline" size="lg">{enterAsPerson}</Button>
    </>} />
    : <AuthStatus icon={Ban} title={t("login.inactiveBusiness", { organizationName: props.organizationName })} detail={t("login.askOwner")} actions={<>
      <Button asChild size="lg">{enterAsPerson}</Button>
      <Button asChild variant="outline" size="lg">{register}</Button>
    </>} />;
}
