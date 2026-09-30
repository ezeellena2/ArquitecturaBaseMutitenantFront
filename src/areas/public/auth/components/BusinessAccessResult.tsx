import { Ban, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export type BusinessAccessResultProps =
  | { status: "noBusiness"; organizationName?: never }
  | { status: "inactive"; organizationName: string };

export function BusinessAccessResult(props: BusinessAccessResultProps) {
  const { t } = useTranslation("auth");

  return props.status === "noBusiness" ? <div className="flex flex-col gap-[22px] text-center">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><Building2 size={20} strokeWidth={1.75} /></span>
    <h1 className="text-2xl font-bold leading-tight">{t("login.noBusiness")}</h1>
    <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--t3)] text-sm font-semibold">{t("login.enterAsPerson")}</Link>
  </div> : <div className="flex flex-col gap-[22px] text-center">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><Ban size={20} strokeWidth={1.75} /></span>
    <h1 className="text-2xl font-bold leading-tight">{t("login.inactiveBusiness", { organizationName: props.organizationName })}</h1>
    <p className="text-sm text-[var(--t2)]">{t("login.askOwner")}</p>
    <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{t("login.enterAsPerson")}</Link>
  </div>;
}
