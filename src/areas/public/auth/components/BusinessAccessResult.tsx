import { Ban, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

export type BusinessAccessResultProps =
  | { status: "noBusiness"; organizationName?: never }
  | { status: "inactive"; organizationName: string };

export function BusinessAccessResult(props: BusinessAccessResultProps) {
  const { t } = useTranslation("auth");

  return props.status === "noBusiness" ? <div className="flex flex-col gap-[22px] text-center">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><Building2 size={20} strokeWidth={1.75} /></span>
    <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("login.noBusiness")}</h1>
    <Button asChild variant="outline" size="lg"><Link to="/login">{t("login.enterAsPerson")}</Link></Button>
  </div> : <div className="flex flex-col gap-[22px] text-center">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><Ban size={20} strokeWidth={1.75} /></span>
    <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("login.inactiveBusiness", { organizationName: props.organizationName })}</h1>
    <p className="text-sm text-[var(--t2)]">{t("login.askOwner")}</p>
    <Button asChild size="lg"><Link to="/login">{t("login.enterAsPerson")}</Link></Button>
  </div>;
}
