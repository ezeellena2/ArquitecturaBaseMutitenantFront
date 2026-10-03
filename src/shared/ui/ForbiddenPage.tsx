import { LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";
import { clearAccessError } from "@/shared/api/accessErrorStore";

export function ForbiddenPage(props: { organizationName?: string; homePath?: string }) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<LockKeyhole size={20} strokeWidth={1.75} />}
    title={t("errorPage.forbidden.title")}
    homePath={props.homePath}
    onHomeClick={clearAccessError}
  />;
}
