import { LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";
import { clearAccessError } from "@/shared/api/accessErrorStore";

export function ForbiddenPage({ organizationName, homePath }: { organizationName?: string; homePath?: string }) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<LockKeyhole size={20} strokeWidth={1.75} />}
    title={t("errorPage.forbidden.title")}
    description={organizationName
      ? t("errorPage.forbidden.description", { organizationName })
      : t("common:errors.forbidden.description")}
    homePath={homePath}
    onHomeClick={clearAccessError}
  />;
}
