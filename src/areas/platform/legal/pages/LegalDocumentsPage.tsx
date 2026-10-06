import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { ListRow } from "@/shared/ui/app/ListRow";
import { Button } from "@/shared/ui/button";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { DocumentIcon } from "@/shared/ui/icons";
import { List, ListItem } from "@/shared/ui/List";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { RowActions } from "@/shared/ui/RowActions";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { fetchLegalDocuments, legalDocumentsQueryKey } from "../api/legalDocuments";
import { nextEffectiveVersion } from "../lib/legalVersions";

export function LegalDocumentsPage() {
  const { t } = useTranslation(["platformLegal", "enums", "common"]); const format = useFormat(); const { phone } = useAppChrome(); const navigate = useNavigate();
  const documents = useQuery({ queryKey: legalDocumentsQueryKey, queryFn: fetchLegalDocuments, meta: { silent: true, blocksView: true } });
  if (documents.isError && !documents.data) return <LoadErrorPage onRetry={() => { void documents.refetch(); }} />;
  const rows = documents.data ?? []; const title = t("platformLegal:title"); const publish = t("platformLegal:newVersion");
  return <Page icon={DocumentIcon} title={title} summary={documents.data ? t("platformLegal:summary", { documents: format.formatInteger(rows.length), versions: format.formatInteger(rows.reduce((total, document) => total + document.versions.length, 0)) }) : undefined}
    phoneSubtitle={t("common:navigation.administration")} backTo={phone ? { to: "/plataforma/mas", label: t("platformLegal:back") } : undefined} phoneBody="flush"
    actions={<Button asChild><Link to="/plataforma/legales/nueva"><Plus aria-hidden="true" />{publish}</Link></Button>} fab={{ label: publish, to: "/plataforma/legales/nueva" }}>
    {documents.isPending ? <p role="status">{t("common:states.loading")}</p> : <Surface phoneFlush><List label={title}>
      {rows.map((document) => {
        const name = t(`enums:LegalDocumentKind.${document.kind}`); const future = nextEffectiveVersion(document);
        const pending = future ? <StatusDot tone="pending" label={t("platformLegal:nextEffective", { version: format.formatInteger(future.version), date: format.formatDate(future.effectiveAtUtc) })} /> : null;
        const actions = <RowActions label={t("platformLegal:rowActions", { name })} title={name} actions={[{ label: publish, accessibleName: publish, icon: Plus, onSelect: () => { void navigate(`/plataforma/legales/nueva?documento=${document.kind}`); } }]} />;
        const version = document.currentVersion == null ? <EmptyValue /> : t("platformLegal:version", { version: format.formatInteger(document.currentVersion) });
        const effective = document.currentEffectiveAtUtc ? format.formatDate(document.currentEffectiveAtUtc) : null;
        return phone ? <ListRow key={document.kind} title={name} meta={version} lines={[
          effective ? t("platformLegal:effectiveSince", { date: effective }) : <EmptyValue key="effective" />,
          <span key="count">{t("platformLegal:versionCount", { count: document.versions.length })}{pending ? <>{" · "}{pending}</> : null}</span>,
        ]} trailing={actions} /> : <ListItem key={document.kind} title={name} detail={<>
          {document.currentVersion != null && effective ? t("platformLegal:current", { version: format.formatInteger(document.currentVersion), date: effective }) : <EmptyValue />}
          {pending ? <span className="mt-1 block">{pending}</span> : null}
        </>}>{actions}</ListItem>;
      })}
    </List></Surface>}
  </Page>;
}
