import { useTranslation } from "react-i18next";
import { Page } from "@/shared/ui/Page";

/** El editor de un catálogo, nuevo (`/nuevo`, donde «Crear catálogo» manda el `POST`) o guardado (`/:id`). Por ahora solo su lugar en el módulo: el editor lo arma la F5. */
export function CatalogEditorPage() {
  const { t } = useTranslation();
  return <Page title={t("forms:nav.catalogs")} />;
}
