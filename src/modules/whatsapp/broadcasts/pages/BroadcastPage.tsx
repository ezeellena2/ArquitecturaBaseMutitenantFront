import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { apiErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { ListRow } from "@/shared/ui/app/ListRow";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { DateText } from "@/shared/ui/format/DateText";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { EyeIcon } from "@/shared/ui/icons";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { InfoButton } from "@/shared/ui/InfoButton";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { homeOf } from "@/tenancy/access";
import { BroadcastsIcon } from "../../components/icons";
import type { WhatsAppBroadcastResponse, WhatsAppRecipientResponse, WhatsAppRecipientStatus } from "../../api/types";
import { broadcastQueryKey, fetchBroadcast, type RecipientsQuery } from "../api/broadcasts";
import { broadcastsPath, contactPath, createRecipientColumns, recipientStatusTones } from "../columns";
import { BroadcastCounters } from "../components/BroadcastCounters";
import { audienceLabel } from "../lib/broadcastText";
import { useBroadcastActions } from "../lib/useBroadcastActions";

const recipientFilterKeys = ["status"] as const;
// Orden del filtro «Estado» de Resultados: todos y después cada paso del envío.
const recipientStatuses: readonly (WhatsAppRecipientStatus | undefined)[] = [undefined, "Pending", "Sent", "Delivered", "Read", "Replied", "Unsubscribed", "Failed"];
const allValue = "all";

/**
 * Resultados de una difusión (tableros WA-Difusion-Resultados y su M-*): la banda con cuándo salió, la plantilla y a
 * quiénes; los contadores; y los destinatarios paginados por el back con el filtro de estado. «No llegó» abre el porqué.
 * Una programada se cancela desde el ⋮; cualquiera se duplica.
 */
export function BroadcastPage({ me }: ModuleContentProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { broadcastId } = useParams();
  const id = broadcastId ?? "";
  const format = useFormat();
  const { phone } = useAppChrome();
  const navigate = useNavigate();
  const { filters, pagination, query, result: detail, paginationProps } = usePagedQuery({
    filterKeys: recipientFilterKeys,
    toQuery: (page, values): RecipientsQuery => ({ ...page, status: recipientStatuses.find((status) => status !== undefined && status === values.status) }),
    queryKey: (recipientsQuery) => broadcastQueryKey(id, recipientsQuery), queryFn: (recipientsQuery) => fetchBroadcast(id, recipientsQuery),
    enabled: Boolean(id), meta: { silent: true, blocksView: true },
  });
  const actions = useBroadcastActions();
  const [failure, setFailure] = useState<WhatsAppRecipientResponse | null>(null);
  const broadcast = detail.data?.broadcast;
  useBreadcrumbLeaf(broadcast?.name);
  const back = { to: broadcastsPath, label: t("whatsapp:broadcasts.back") };

  if (detail.isPending) return <Page icon={BroadcastsIcon} title={t("whatsapp:broadcasts.detail.loading")} backTo={back}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  if (!broadcast) return isNotFoundError(detail.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("whatsapp:broadcasts.detail.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void detail.refetch(); }} screen={t("whatsapp:broadcasts.detail.title")} back={back} />;

  const name = (recipient: WhatsAppRecipientResponse) => recipient.contactName ?? (format.isLoading ? "" : format.formatPhone(recipient.displayNumber));
  // «No llegó» con su ⓘ: el motivo que informó Meta y qué hacer (tablero WA-Difusion-Resultados, «Por qué no llegó»).
  const status = (recipient: WhatsAppRecipientResponse) => <span className="inline-flex max-w-full items-center gap-1">
    <StatusBadge tones={recipientStatusTones} value={recipient.status} />
    {recipient.status === "Failed" ? <InfoButton label={t("whatsapp:broadcasts.failure.why")} onClick={() => setFailure(recipient)} /> : null}
  </span>;
  // La ficha del contacto es de «Atender clientes» (D3): sin ese permiso, la fila no lleva a ella.
  const canSeeContacts = me.effectivePermissions.organization.includes("whatsapp.customers");
  const recipientActions = (recipient: WhatsAppRecipientResponse) => <RowActions label={t("whatsapp:broadcasts.recipients.rowActions", { name: name(recipient) })} title={name(recipient)} actions={[
    { label: t("whatsapp:broadcasts.recipients.viewContact"), accessibleName: t("whatsapp:broadcasts.recipients.viewContact"), icon: EyeIcon,
      hidden: !canSeeContacts, onSelect: () => { void navigate(contactPath(recipient.contactId)); } },
  ]} />;
  const columns: Column<WhatsAppRecipientResponse>[] = [
    ...createRecipientColumns(t, status),
    { id: "actions", header: t("whatsapp:broadcasts.columns.actions"), type: "actions", cell: recipientActions },
  ];
  const filtered = Boolean(query.status || pagination.search);
  const scheduled = broadcast.status === "Scheduled";

  return <>
    <Page icon={BroadcastsIcon} title={broadcast.name} backTo={back} phoneBody="flush"
      summary={<BroadcastSummary broadcast={broadcast} />} phoneSubtitle={<BroadcastSummary broadcast={broadcast} short />}
      actions={phone ? undefined : <Button type="button" variant="outline" onClick={() => actions.duplicate(broadcast)}>{t("whatsapp:broadcasts.actions.duplicate")}</Button>}
      moreActions={{ label: t(phone ? "whatsapp:broadcasts.detail.actions" : "whatsapp:broadcasts.detail.more"), items: [
        { label: t("whatsapp:broadcasts.actions.duplicate"), hidden: !phone, onSelect: () => actions.duplicate(broadcast) },
        { label: t("whatsapp:broadcasts.actions.cancel"), destructive: true, hidden: !scheduled, onSelect: (trigger) => actions.askCancel(broadcast, trigger) },
      ] }}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <BroadcastCounters broadcast={broadcast} />
        <FilterBar label={t("whatsapp:broadcasts.filters.label")} searchLabel={t("whatsapp:broadcasts.recipients.search")}
          searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
          filters={[{ key: "status", label: t("whatsapp:broadcasts.recipients.filter"), menuLabel: t("whatsapp:broadcasts.recipients.filterMenu"),
            value: query.status ?? "", active: query.status !== undefined, onChange: (value) => filters.setFilter("status", value === allValue ? undefined : value),
            options: recipientStatuses.map((value) => ({ value: value ?? allValue, label: value ? format.formatEnum("WhatsAppRecipientStatus", value) : t("whatsapp:broadcasts.recipients.allStatuses") })) }]}
          clearLabel={t("common:actions.clearFilters")} onClear={filters.clear} />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={detail.data?.items ?? []} rowKey={(recipient) => recipient.contactId}
            mobileRow={(recipient) => <ListRow key={recipient.contactId} title={name(recipient)} meta={<DateText value={recipient.changedAtUtc} kind="shortDateTime" />}
              lines={[recipient.contactName ? <PhoneText key="number" value={recipient.displayNumber} /> : null, status(recipient)]}
              trailing={canSeeContacts ? recipientActions(recipient) : undefined} />}
            isFetching={detail.isFetching} error={detail.error ? apiErrorMessage(detail.error, t) : undefined} onRetry={() => { void detail.refetch(); }}
            emptyTitle={filtered ? t("whatsapp:broadcasts.recipients.empty.filtered") : t("whatsapp:broadcasts.recipients.empty.all")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined} />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    {actions.dialog}
    {failure ? <ImportantNotice open onOpenChange={(open) => { if (!open) setFailure(null); }}
      title={t("whatsapp:broadcasts.failure.title", { name: name(failure) })}
      reason={failure.failureReason ?? t("whatsapp:broadcasts.failure.unknown")}
      detail={t("whatsapp:broadcasts.failure.informed", { date: format.formatDate(failure.changedAtUtc), time: format.formatTime(failure.changedAtUtc) })}
      steps={[t("whatsapp:broadcasts.failure.checkNumber"), t("whatsapp:broadcasts.failure.importAgain")]} /> : null}
  </>;
}

/// «Enviada el 25/09/2026 · Plantilla «Promo semanal» · Minorista»; en el teléfono, «25/09 · Promo semanal · Minorista».
function BroadcastSummary({ broadcast, short = false }: { broadcast: WhatsAppBroadcastResponse; short?: boolean }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const when = broadcast.sentAtUtc ?? broadcast.scheduledAtUtc;
  const audience = audienceLabel(broadcast.audience, t);
  if (short) return <>{when ? <><DateText value={when} kind={broadcast.sentAtUtc ? "shortDate" : "shortDateTime"} />{" · "}</> : null}{broadcast.template.name}{" · "}{audience}</>;
  const status = broadcast.status === "Sent" && broadcast.sentAtUtc ? t("broadcasts.detail.sentOn", { date: format.formatDate(broadcast.sentAtUtc) })
    : broadcast.status === "Scheduled" && broadcast.scheduledAtUtc ? t("broadcasts.detail.scheduledFor", { date: format.formatDateTime(broadcast.scheduledAtUtc) })
      : format.formatEnum("WhatsAppBroadcastStatus", broadcast.status);
  return <>{status}{" · "}{t("broadcasts.template", { name: broadcast.template.name })}{" · "}{audience}</>;
}
