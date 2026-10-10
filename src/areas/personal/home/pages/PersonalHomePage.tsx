import { HomeIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Page } from "@/shared/ui/Page";
import { PersonalLoginMethodNotice } from "@/shared/account/PersonalLoginMethodNotice";
import { ModuleHome } from "@/shared/modules/ModuleRegistry";
import { useAppChrome } from "@/shared/ui/app/AppChrome";

// Tablero Inicio-Personal: la banda «Inicio» y, si hace falta, el aviso de método propio.
export function PersonalHomePage() {
  const { t } = useTranslation();
  const { data } = useCurrentUser();
  const { phone } = useAppChrome();
  const notice = data?.needsPersonalLoginMethod ? <PersonalLoginMethodNotice className="mx-4 mt-2" /> : null;
  const original = <Page icon={HomeIcon} title={t("home.title")} phoneBody="flush">{notice}</Page>;
  return phone ? original : <ModuleHome access="consumer" fallback={original}>{notice}</ModuleHome>;
}
