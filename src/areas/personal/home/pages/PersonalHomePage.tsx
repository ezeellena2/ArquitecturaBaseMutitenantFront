import { useTranslation } from "react-i18next";
import { Page } from "@/shared/ui/Page";
import { ModuleHome } from "@/shared/modules/ModuleRegistry";
import { useAppChrome } from "@/shared/ui/app/AppChrome";

// Tablero Inicio-Personal: la banda «Inicio». El aviso de método propio va en la campana, sin cartel (175).
export function PersonalHomePage() {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const original = <Page title={t("home.title")} phoneBody="flush" />;
  return phone ? original : <ModuleHome access="consumer" fallback={original} />;
}
