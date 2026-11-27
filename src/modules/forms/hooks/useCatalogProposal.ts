import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  assistantActionKey, assistantProposalParam, useAssistantProposal, useAssistantProposalFieldReview, useAssistantProposalQuery,
  useDropAssistantProposal, useLoadAssistantProposalOnce, type AssistantProposalChangeItem, type AssistantProposalChangeRow,
} from "@/shared/assistant-actions";
import { fetchCatalogItems, formsQueryRoot } from "../api/catalogs";
import type { FormCatalogItemRow } from "../api/types";
import {
  catalogProposalAction, catalogProposalBase, catalogProposalDraft, catalogProposalFields, catalogProposalTargets, proposalKeyOf,
  toCatalogProposalRows,
} from "../lib/proposal";
import type { CatalogEditor, CatalogRowView } from "./useCatalogEditor";

/**
 * Las opciones guardadas que toca la propuesta, por su id: se buscan por el texto de ahora que leyó el servidor, una vez
 * por texto. Las 10.000 de un catálogo no se leen enteras.
 */
async function fetchProposalTargets(catalogId: string, targets: readonly { itemId: string; label: string }[], signal: AbortSignal): Promise<FormCatalogItemRow[]> {
  const ids = new Set(targets.map((target) => target.itemId));
  const labels = [...new Set(targets.map((target) => target.label))];
  const pages = await Promise.all(labels.map((label) => fetchCatalogItems(catalogId, { page: 1, pageSize: 100, search: label || undefined, status: "All" }, signal)));
  const found = new Map(pages.flatMap((page) => page.items).filter((row) => ids.has(row.id)).map((row) => [row.id, row]));
  return [...found.values()];
}

/**
 * La propuesta del asistente en el editor de un catálogo a mano (catalogoptions.edit@1, FRM-Catalogo-Opciones-Propuesta y
 * su M-): con `?proposal=<id>`, lo propuesto entra una vez en el borrador, sin guardar, sobre las opciones guardadas que
 * toca. Da «Lo que cambia», con lo que se va a mandar; «Revisá» en cada opción dudosa, y si el catálogo cambió desde la
 * propuesta. Si una opción propuesta no se puede dibujar, el editor sigue como siempre.
 */
export function useCatalogProposal(editor: CatalogEditor, editable: boolean) {
  const { t } = useTranslation(["forms", "common"]);
  const { saved, valueType } = editor;
  const [params] = useSearchParams();
  const proposalId = params.get(assistantProposalParam);
  const data = useAssistantProposalQuery(proposalId).data;
  const forThisCatalog = Boolean(saved && editable && saved.source === "Manual" && data && data.kind === "action" && data.state === "new"
    && assistantActionKey(data.action, data.version) === catalogProposalAction && data.target?.id === saved.id);
  const targets = useMemo(() => forThisCatalog && data ? catalogProposalTargets(data.values) : [], [forThisCatalog, data]);
  const touchedQuery = useQuery({
    queryKey: [...formsQueryRoot, "proposalTargets", saved?.id ?? "", proposalId ?? ""],
    queryFn: ({ signal }) => fetchProposalTargets(saved!.id, targets, signal),
    enabled: forThisCatalog,
    staleTime: Infinity,
  });
  const touched = touchedQuery.data;
  // Cada opción que cambia o se quita tiene que estar a la vista; si no se encontró, la propuesta no se abre.
  const found = touched !== undefined && targets.every((target) => touched.some((row) => row.id === target.itemId));
  const base = useMemo(() => found && touched ? catalogProposalBase(touched) : undefined, [found, touched]);
  const fields = useMemo(() => catalogProposalFields(valueType), [valueType]);
  const proposal = useAssistantProposal(catalogProposalAction, toCatalogProposalRows, base, fields);
  const draft = useMemo(() => proposal.status === "ready" && touched ? catalogProposalDraft(proposal.formValues, touched, valueType) : undefined,
    [proposal, touched, valueType]);
  const proposing = forThisCatalog && proposal.status === "ready" && draft && touched ? { ...proposal, draft, touched } : undefined;

  useLoadAssistantProposalOnce(proposing, (ready) => editor.propose(ready.touched, ready.draft));
  const drop = useDropAssistantProposal();
  const review = useAssistantProposalFieldReview();

  const doubtOf = (row: CatalogRowView) => {
    const key = row.itemId ?? proposalKeyOf(row.localId);
    return proposing && key ? proposing.doubtOf("options", key) : undefined;
  };
  /** «Revisá» en el texto de una opción dudosa, con su motivo debajo. */
  const rowReview = proposing ? (row: CatalogRowView) => review([doubtOf(row)]) : undefined;

  // «Cambia»: «Detalle de Venta nueva», con lo que cambió y el texto guardado de la opción.
  const savedText = (row: CatalogRowView) => touched?.find((item) => item.id === row.itemId)?.text
    ?? editor.items.data?.items.find((item) => item.id === row.itemId)?.text ?? row.draft.text;
  const changedLabel = (row: CatalogRowView) => {
    const sentence = t("forms:catalog.proposal.changed", {
      fields: editor.changedFields(row.key).map((field) => t(`forms:catalog.proposal.fields.${field}`)), option: savedText(row),
    });
    return sentence.charAt(0).toLocaleUpperCase() + sentence.slice(1);
  };
  const item = (row: CatalogRowView, label: string): AssistantProposalChangeItem => ({ key: row.key, label, review: Boolean(doubtOf(row)) });
  // «Lo que cambia», sobre lo guardado y con lo que se va a mandar: lo propuesto y lo que la persona cambie después.
  const changeRows: AssistantProposalChangeRow[] = proposing ? [{
    key: "options",
    added: editor.rows.filter((row) => row.isNew).map((row) => item(row, row.draft.text.trim() || t("forms:catalog.newOption"))),
    changed: editor.rows.filter((row) => !row.isNew && !row.pendingDelete && editor.changedFields(row.key).length > 0).map((row) => item(row, changedLabel(row))),
    removed: editor.rows.filter((row) => row.pendingDelete).map((row) => item(row, savedText(row))),
  }] : [];
  const changedSince = Boolean(proposing && saved && proposing.proposal.baseVersion != null && proposing.proposal.baseVersion !== saved.version);

  return {
    proposing: Boolean(proposing),
    changeRows,
    changedSince,
    rowReview,
    /** Descartar también descarta la propuesta: sin `?proposal`, el editor vuelve a ser el de siempre. */
    drop: proposing ? drop : undefined,
    /** Después del 2xx del `PUT`, con la versión nueva: la tarjeta del hilo pasa a aplicada. */
    markApplied: proposing?.markApplied,
  };
}
