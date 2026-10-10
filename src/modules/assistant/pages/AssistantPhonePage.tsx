import { useTranslation } from "react-i18next";
import { Page } from "@/shared/ui/Page";
import { AssistantHome, type AssistantHomeProps } from "./AssistantHome";

/** El marco y Page son dueños de la barra y de la navegación del teléfono. */
export function AssistantPhonePage(props: AssistantHomeProps) {
  const { t } = useTranslation("assistant");
  return <Page title={t("title")} phoneBody="flush" bodyClassName="min-h-0 flex-1 overflow-hidden p-0!">
    <AssistantHome {...props} />
  </Page>;
}
