import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { CatalogOriginFields, type CatalogOrigin } from "../components/catalog/CatalogOriginFields";
import { catalogsPath } from "../registration";

/**
 * El editor de un catálogo, nuevo (`/nuevo`, donde «Crear catálogo» manda el `POST`) o guardado (`/:id`). Uno nuevo abre con
 * «El catálogo», donde se eligen el origen y el tipo de valor (262, F3). El resto del editor (el nombre, las opciones, guardar
 * y el guardado) lo arma la F5.
 */
export function CatalogEditorPage() {
  const { t } = useTranslation(["forms"]);
  const { id } = useParams();
  const [origin, setOrigin] = useState<CatalogOrigin>({ source: "Manual", valueType: "Text" });
  if (id) return <Page title={t("forms:nav.catalogs")} />;
  return <Page title={t("forms:catalogs.new")} backTo={{ to: catalogsPath, label: t("forms:catalog.backToList") }}>
    <Section title={t("forms:catalog.section")}>
      <SectionFields className="grid gap-3.5">
        <CatalogOriginFields value={origin} onChange={setOrigin} />
      </SectionFields>
    </Section>
  </Page>;
}
