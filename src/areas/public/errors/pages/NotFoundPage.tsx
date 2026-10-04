import { useTranslation } from "react-i18next";
import { SearchIcon } from "@/shared/ui/icons";
import { ErrorPageFrame } from "./ErrorPageFrame";

export function NotFoundPage({ homePath }: { homePath?: string }) {
  const { t } = useTranslation("errors");
  return <ErrorPageFrame
    icon={<SearchIcon className="size-5" />}
    title={t("errorPage.notFound.title")}
    homePath={homePath}
  />;
}
