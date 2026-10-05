import { HomeIcon } from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Page } from "@/shared/ui/Page";
import { PersonalLoginMethodNotice } from "@/shared/account/PersonalLoginMethodNotice";

// Tablero Inicio-Personal: la banda «Inicio» y, si hace falta, el aviso de método propio.
export function PersonalHomePage() {
  const { t } = useTranslation();
  const { data } = useCurrentUser();
  return <Page icon={HomeIcon} title={t("home.title")} phoneBody="flush">
    {data?.needsPersonalLoginMethod ? <PersonalLoginMethodNotice className="mx-4 mt-2" /> : null}
  </Page>;
}
