import { useTranslation } from "react-i18next";
import { Page } from "@/shared/ui/Page";
import { AssistantHome, type AssistantHomeProps } from "./AssistantHome";

/** El marco y Page son dueños de la barra y de la navegación del teléfono. Como chat, el hilo se desplaza adentro y la
 * caja de escribir queda abajo (M-Asistente-Org, -Personal y -Plat). */
export function AssistantPhonePage(props: AssistantHomeProps) {
  const { t } = useTranslation("assistant");
  return <Page title={t("title")} phoneBody="chat">
    <AssistantHome {...props} />
  </Page>;
}
