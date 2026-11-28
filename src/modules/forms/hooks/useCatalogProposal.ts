import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  assistantActionKey, assistantProposalParam, useAssistantProposal, useAssistantProposalFieldReview, useAssistantProposalQuery,
  useDropAssistantProposal, useLoadAssistantProposalOnce, type AssistantProposalChangeItem, type AssistantProposalChangeRow,
} from "@/shared/assistant-actions";
import { catalogProposalTargetsQueryKey, fetchCatalogItems } from "../api/catalogs";
import {
  catalogProposalAction, catalogProposalBase, catalogProposalDraft, catalogProposalFields, catalogProposalRowsOf, catalogProposalTargets,
  proposalKeyOf,
} from "../lib/proposal";
import { findProposalTargets } from "../lib/proposalTargets";
import { catalogQueryOptions } from "./useCatalogData";
import type { CatalogEditor, CatalogRowView } from "./useCatalogEditor";

/**
 * La propuesta del asistente que es para este catálogo (catalogoptions.edit@1, con `?proposal=<id>`), y las opciones
 * guardadas que toca, leídas por su consulta: el editor las recibe como `extraRows` y las muestra aunque no estén en la
 * página. Va antes del editor: solo lee la ficha (la misma consulta que el editor) y la propuesta.
 */
export function useCatalogProposalTargets(id: string) {
  const saved = useQuery(catalogQueryOptions(id)).data;
  const [params] = useSearchParams();
  const proposalId = params.get(assistantProposalParam);
  const proposal = useAssistantProposalQuery(proposalId).data;
  const forThisCatalog = Boolean(saved?.canManage && saved.isActive && saved.source === "Manual" && proposal && proposal.kind === "action"
    && proposal.state === "new" && assistantActionKey(proposal.action, proposal.version) === catalogProposalAction && proposal.target?.id === saved.id);
  const targets = useMemo(() => forThisCatalog && proposal ? catalogProposalTargets(proposal.values) : [], [forThisCatalog, proposal]);
  const touched = useQuery({
    queryKey: catalogProposalTargetsQueryKey(id, proposalId ?? ""),
    queryFn: ({ signal }) => findProposalTargets(targets, saved?.itemCounts.total ?? 0, (query) => fetchCatalogItems(id, query, signal)),
    enabled: forThisCatalog,
    staleTime: Infinity,
  });
  return { forThisCatalog, targets, rows: forThisCatalog ? touched.data : undefined };
}

export type CatalogProposalTargets = ReturnType<typeof useCatalogProposalTargets>;

/**
 * La propuesta del asistente en el editor de un catálogo a mano (catalogoptions.edit@1, FRM-Catalogo-Opciones-Propuesta y
 * su M-): lo propuesto entra una vez en el borrador, sin guardar, sobre las opciones guardadas que toca. Da «Lo que
 * cambia», con lo que se va a mandar; «Revisá» en cada opción dudosa, y si el catálogo cambió desde la propuesta. Si una
 * opción propuesta no se puede dibujar, el editor sigue como siempre.
 */
export function useCatalogProposal(editor: CatalogEditor, { forThisCatalog, targets, rows: touched }: CatalogProposalTargets) {
  const { t } = useTranslation(["forms", "common"]);
  const { saved, valueType } = editor;
  // Cada opción que cambia o se quita tiene que estar a la vista; si no se encontró, la propuesta no se abre.
  const found = touched !== undefined && targets.every((target) => touched.some((row) => row.id === target.itemId));
  const base = useMemo(() => found && touched ? catalogProposalBase(touched) : undefined, [found, touched]);
  // Los campos activos del catálogo son columnas de la fila (E13): el contrato y la lectura se arman una vez por catálogo.
  const savedFields = saved?.fields;
  const fields = useMemo(() => catalogProposalFields(valueType, savedFields ?? []), [valueType, savedFields]);
  const toRows = useMemo(() => catalogProposalRowsOf(savedFields ?? []), [savedFields]);
  const proposal = useAssistantProposal(catalogProposalAction, toRows, base, fields);
  const draft = useMemo(() => proposal.status === "ready" && touched ? catalogProposalDraft(proposal.formValues, touched, valueType) : undefined,
    [proposal, touched, valueType]);
  const proposing = forThisCatalog && proposal.status === "ready" && draft ? { ...proposal, draft } : undefined;

  useLoadAssistantProposalOnce(proposing, (ready) => editor.propose(ready.draft));
  const drop = useDropAssistantProposal();
  const review = useAssistantProposalFieldReview();

  const doubtOf = (row: CatalogRowView) => {
    const key = row.itemId ?? proposalKeyOf(row.localId);
    return proposing && key ? proposing.doubtOf("options", key) : undefined;
  };
  /** «Revisá» en el texto de una opción dudosa, con su motivo debajo. */
  const rowReview = proposing ? (row: CatalogRowView) => review([doubtOf(row)]) : undefined;

  // «Cambia»: «Detalle de Venta nueva», con lo que cambió y el texto guardado de la opción.
  const savedText = (row: CatalogRowView) => editor.savedRow(row.itemId)?.text ?? row.draft.text;
  // Lo que cambió de una opción: sus columnas fijas y, por su nombre, cada campo cuyo valor cambia (E13).
  const changedNames = (row: CatalogRowView) => [
    ...editor.changedFields(row.key).map((field) => t(`forms:catalog.proposal.fields.${field}`)),
    ...Object.keys(editor.edits[row.key]?.fields ?? {}).flatMap((id) => savedFields?.find((field) => field.id === id)?.name ?? []),
  ];
  const changedLabel = (row: CatalogRowView) => {
    const sentence = t("forms:catalog.proposal.changed", { fields: changedNames(row), option: savedText(row) });
    return sentence.charAt(0).toLocaleUpperCase() + sentence.slice(1);
  };
  const item = (row: CatalogRowView, label: string): AssistantProposalChangeItem => ({ key: row.key, label, review: Boolean(doubtOf(row)) });
  // «Lo que cambia», sobre lo guardado y con lo que se va a mandar: lo propuesto y lo que la persona cambie después.
  const changeRows: AssistantProposalChangeRow[] = proposing ? [{
    key: "options",
    added: editor.rows.filter((row) => row.isNew).map((row) => item(row, row.draft.text.trim() || t("forms:catalog.newOption"))),
    changed: editor.rows.filter((row) => !row.isNew && !row.pendingDelete && changedNames(row).length > 0).map((row) => item(row, changedLabel(row))),
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
