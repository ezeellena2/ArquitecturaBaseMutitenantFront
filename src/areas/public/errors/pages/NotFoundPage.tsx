import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorPageFrame } from "./ErrorPageFrame";

export function NotFoundPage({ homePath }: { homePath?: string }) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<Search size={20} strokeWidth={1.75} />}
    title={t("errorPage.notFound.title")}
    description={t("errorPage.notFound.description")}
    homePath={homePath}
  />;
}
