import { useMutation } from "@tanstack/react-query";
import { ArrowUpDown, Code, Download, FileText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toastActionError } from "@/shared/api/errorMessage";
import { saveResponseAs } from "@/shared/lib/saveFile";
import type { PageOverflowAction } from "@/shared/ui/Page";
import type { RowAction } from "@/shared/ui/RowActions";
import { exportCatalog, fetchCatalogTemplate } from "../api/catalogs";
import { SortDialog } from "../components/catalog/SortDialog";
import type { CatalogEditor } from "./useCatalogEditor";

/**
 * «Exportar», la plantilla, «Ordenar por…» y los códigos que faltan, con el diálogo de ordenar. En la compu van en el
 * encabezado de «Opciones» (FRM-Catalogo); en el teléfono, en el ⋮ de la banda, con el nombre del catálogo de título
 * (M-FRM-Catalogo, «Más acciones»). Los íconos son los del lienzo: la plantilla, un documento con renglones; los códigos, «</>».
 */
export function useOptionsActions(editor: CatalogEditor, { editable, isNew }: { editable: boolean; isNew: boolean }) {
  const { t } = useTranslation(["forms", "common"]);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortTrigger, setSortTrigger] = useState<HTMLElement | null>(null);
  const { saved, valueType } = editor;
  const sortReason = isNew ? t("forms:catalog.reasons.saveFirst")
    : editor.deletes.size ? t("forms:catalog.reasons.deletePendingSort")
    : editor.moves.length ? t("forms:catalog.reasons.discardMovesFirst") : undefined;
  const exportReason = isNew ? t("forms:catalog.reasons.saveFirst") : undefined;

  // Exportar y la plantilla: red, 5xx y 429 los avisa el MutationCache; un rechazo de negocio (sin permiso, el módulo
  // apagado), un aviso (errores).
  const download = useMutation({
    mutationFn: async (kind: "export" | "template") => {
      if (kind === "export" && saved) await saveResponseAs(await exportCatalog(saved.id), `${saved.name}.xlsx`);
      else await saveResponseAs(await fetchCatalogTemplate(valueType), `${t("forms:catalog.templateFile")}.xlsx`);
    },
    onError: (error) => toastActionError(error, t),
  });

  const exportAction: RowAction = { label: t("forms:catalog.actions.export"), accessibleName: t("forms:catalog.actions.export"), icon: Download,
    disabledReason: exportReason, onSelect: () => download.mutate("export") };
  const more: RowAction[] = [
    { label: t("forms:catalog.actions.template"), accessibleName: t("forms:catalog.actions.template"), icon: FileText, onSelect: () => download.mutate("template") },
    { label: t("forms:catalog.actions.sort"), accessibleName: t("forms:catalog.actions.sort"), icon: ArrowUpDown, hidden: !editable, disabledReason: sortReason, onSelect: (trigger) => { setSortTrigger(trigger); setSortOpen(true); } },
    { label: t("forms:catalog.actions.generateCodes"), accessibleName: t("forms:catalog.actions.generateCodes"), icon: Code, hidden: !editable, onSelect: editor.generateMissingCodes },
  ];
  const bandItems: PageOverflowAction[] = [exportAction, ...more]
    .map(({ label, icon, hidden, disabledReason, onSelect }) => ({ label, icon, hidden, disabledReason, onSelect }));

  return {
    exportAction,
    more,
    /** En el teléfono: «Exportar», la plantilla, «Ordenar por…» y los códigos que faltan, en el ⋮ de la banda. */
    bandItems,
    exportCatalog: () => download.mutate("export"),
    sortDialog: <SortDialog open={sortOpen} initial={editor.sort} fields={saved?.fields ?? []} returnFocusTo={sortTrigger} onOpenChange={setSortOpen} onSort={editor.setSort} />,
  };
}

export type OptionsActions = ReturnType<typeof useOptionsActions>;
