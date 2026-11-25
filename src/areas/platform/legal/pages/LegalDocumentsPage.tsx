import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useFormat } from "@/shared/format/useFormat";
import { usePagination } from "@/shared/hooks/usePagination";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import type { PlatformLegalDocumentGroupResponse } from "@/shared/api/types";
import { ListCard } from "@/shared/ui/app/ListRow";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { sortRows } from "@/shared/ui/tableSort";
import { fetchLegalDocuments, legalDocumentsQueryKey } from "../api/legalDocuments";
import { nextEffectiveVersion } from "../lib/legalVersions";

type Document = PlatformLegalDocumentGroupResponse;

export function LegalDocumentsPage() {
  const { t } = useTranslation(["platformLegal", "enums", "common"]); const format = useFormat(); const { phone } = useAppChrome(); const navigate = useNavigate();
  const documents = useQuery({ queryKey: legalDocumentsQueryKey, queryFn: fetchLegalDocuments, meta: { silent: true, blocksView: true } });
  // Los documentos llegan enteros: ordenan en el navegador, con el orden en la dirección (264).
  const { sort, setSort } = usePagination();
  if (documents.isError && !documents.data) return <LoadErrorPage onRetry={() => { void documents.refetch(); }} />;
  const rows = documents.data ?? []; const title = t("platformLegal:title"); const publish = t("platformLegal:newVersion");
  const documentName = (document: Document) => t(`enums:LegalDocumentKind.${document.kind}`);
  const versionText = (version: number | null | undefined) => version == null ? <EmptyValue /> : t("platformLegal:version", { version: format.formatInteger(version) });
  const actions = (document: Document) => <RowActions label={t("platformLegal:rowActions", { name: documentName(document) })} title={documentName(document)}
    actions={[{ label: publish, accessibleName: publish, icon: Plus, onSelect: () => { void navigate(`/plataforma/legales/nueva?documento=${document.kind}`); } }]} />;
  const columns: Column<Document>[] = [
    { id: "kind", sortable: true, sortValue: (document) => documentName(document), header: t("platformLegal:columns.document"), type: "custom", mobile: "primary", className: "w-[28%]",
      cell: (document) => <span className="font-medium text-[var(--t1)]">{documentName(document)}</span> },
    { id: "currentVersion", sortable: true, sortAs: "number", sortValue: (document) => document.currentVersion, header: t("platformLegal:columns.current"), type: "custom", cell: (document) => versionText(document.currentVersion) },
    { id: "currentEffectiveAtUtc", sortable: true, header: t("platformLegal:columns.currentSince"), type: "date", value: (document) => document.currentEffectiveAtUtc },
    { id: "scheduledVersion", sortable: true, sortAs: "number", sortValue: (document) => nextEffectiveVersion(document)?.version, header: t("platformLegal:columns.scheduled"), type: "custom", cell: (document) => versionText(nextEffectiveVersion(document)?.version) },
    { id: "scheduledEffectiveAtUtc", sortable: true, header: t("platformLegal:columns.scheduledSince"), type: "date", value: (document) => nextEffectiveVersion(document)?.effectiveAtUtc },
    { id: "actions", header: t("platformLegal:columns.actions"), type: "actions", cell: actions },
  ];
  return <Page title={title} summary={documents.data ? t("platformLegal:summary", { documents: format.formatInteger(rows.length), versions: format.formatInteger(rows.reduce((total, document) => total + document.versions.length, 0)) }) : undefined}
    phoneSubtitle={t("common:navigation.administration")} backTo={phone ? { to: "/plataforma/mas", label: t("platformLegal:back") } : undefined} phoneBody="flush"
    actions={<Button asChild><Link to="/plataforma/legales/nueva"><Plus aria-hidden="true" />{publish}</Link></Button>} fab={{ label: publish, to: "/plataforma/legales/nueva" }}>
    {/* Tableros Legales-Base2 y M-Filas-Base2 (M-Legales, 263): un dato por columna; la versión programada y su fecha, en sus
        columnas, y en el teléfono una tarjeta con cada dato nombrado. */}
    <Surface className="overflow-hidden" phoneFlush>
      <DataTable columns={columns} rows={sortRows(rows, columns, sort)} rowKey={(document) => document.kind} isLoading={documents.isPending}
        sort={sort} onSortChange={setSort}
        mobileRow={(document) => <ListCard key={document.kind} title={documentName(document)} fields={[
          { label: t("platformLegal:card.current"), value: versionText(document.currentVersion) },
          { label: t("platformLegal:card.currentSince"), value: <DateText value={document.currentEffectiveAtUtc} kind="date" /> },
          { label: t("platformLegal:card.scheduled"), value: versionText(nextEffectiveVersion(document)?.version) },
          { label: t("platformLegal:card.scheduledSince"), value: <DateText value={nextEffectiveVersion(document)?.effectiveAtUtc} kind="date" /> },
        ]} trailing={actions(document)} />} />
    </Surface>
  </Page>;
}
