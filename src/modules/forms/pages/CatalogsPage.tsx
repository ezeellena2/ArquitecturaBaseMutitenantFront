import { useTranslation } from "react-i18next";
import { Page } from "@/shared/ui/Page";

/** El listado de catálogos (FRM-Catalogos y M-FRM-Catalogos). Por ahora solo su lugar en el módulo: el listado lo arma la F3. */
export function CatalogsPage() {
  const { t } = useTranslation();
  return <Page title={t("forms:nav.catalogs")} />;
}
