import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";
import { LockIcon } from "./icons";
import { clearAccessError } from "@/shared/api/accessErrorStore";

export function ForbiddenPage(props: { organizationName?: string; homePath: string }) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<LockIcon className="size-5" />}
    title={t("errorPage.forbidden.title")}
    homePath={props.homePath}
    onHomeClick={clearAccessError}
  />;
}
