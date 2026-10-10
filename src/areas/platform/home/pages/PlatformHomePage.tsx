import { useTranslation } from "react-i18next";
import { ModuleHome } from "@/shared/modules/ModuleRegistry";
import { Page } from "@/shared/ui/Page";
import { HomeIcon } from "@/shared/ui/icons";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { PlatformToResolve } from "../components/PlatformToResolve";

/** El operador tiene sólo contexto Plataforma; los datos los aportan servicios reales. */
export function PlatformHomePage() {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const original = <Page icon={HomeIcon} title={t("home.title")} summary={t("navigation.platform")} />;
  return phone ? original : <ModuleHome access="platform" fallback={original}><PlatformToResolve /></ModuleHome>;
}
