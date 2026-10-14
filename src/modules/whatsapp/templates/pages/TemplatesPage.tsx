import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { WhatsAppIcon } from "@/shared/ui/icons";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Surface } from "@/shared/ui/Surface";
import type { WhatsAppTemplateGroup, WhatsAppTemplateResponse } from "../../api/types";
import { deleteTemplate, fetchTemplatePage, templatesQueryKey, templatesQueryRoot, type TemplateScope, type TemplatesQuery } from "../api/templates";
import { createTemplateColumns, templatePhoneRow, templateTitle } from "../columns";
import { TemplateDialog } from "../components/TemplateDialog";

type Group = NonNullable<WhatsAppTemplateGroup>;

/// «Para consultas | Del sistema» vive en la URL (`?grupo=sistema`); sin nada, las de consultas.
const groupKeys = ["grupo"] as const;
const systemValue = "sistema";
const groups: readonly Group[] = ["Consultations", "System"];
const groupFrom = (value: string | undefined): Group => value === systemValue ? "System" : "Consultations";

/// Tableros WA-Plantillas y Plat-WA-Plantillas (y sus M-*): la lista con el estado en Meta, «Nueva plantilla» en la
/// banda (el «+» en el teléfono) y, en el ⋮, duplicar (una aprobada no se edita: se abre «Nueva plantilla» con sus datos,
/// CC17) o borrar. Las del sistema de Plataforma son de solo lectura y van en su propia vista, con el segmentado arriba
/// de la lista (regla F8).
function TemplatesPage({ scope }: { scope: TemplateScope }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const queryClient = useQueryClient();
  const platform = scope === "platform";
  const [creating, setCreating] = useState<{ original?: WhatsAppTemplateResponse; returnFocusTo?: HTMLElement | null } | null>(null);
  const [rejected, setRejected] = useState<WhatsAppTemplateResponse | null>(null);
  const [deleting, setDeleting] = useState<{ template: WhatsAppTemplateResponse; returnFocusTo: HTMLElement | null } | null>(null);
  const { filters, result: list, paginationProps: listPagination } = usePagedQuery({
    filterKeys: groupKeys,
    toQuery: ({ page, pageSize, search }, values): TemplatesQuery => ({ page, pageSize, search, group: platform ? groupFrom(values.grupo) : undefined }),
    queryKey: (query) => templatesQueryKey(scope, query), queryFn: (query) => fetchTemplatePage(scope, query),
    meta: { silent: true, blocksView: true },
  });
  const group = groupFrom(filters.values.grupo);
  // Los conteos de cada vista y el resumen de la banda los trae la lista (CC07 y CC19); en Plataforma, de los dos grupos.
  const shown = list.isPlaceholderData ? undefined : list.data;
  const groupCount = (value: Group) => (value === "System" ? shown?.system : shown?.consultations) ?? undefined;
  const total = platform && shown?.consultations != null && shown.system != null ? shown.consultations + shown.system : shown?.totalCount;
  const summary = shown && total !== undefined
    ? `${t("whatsapp:templates.summary", { count: total })} · ${t("whatsapp:templates.approved", { count: shown.approved })}`
    : undefined;

  const remove = useMutation({
    mutationFn: (template: WhatsAppTemplateResponse) => deleteTemplate(scope, template.id, template.version),
    onSuccess: async (_result, template) => {
      setDeleting(null);
      toast.success(t("whatsapp:templates.messages.deleted", { name: template.name }));
      await queryClient.invalidateQueries({ queryKey: templatesQueryRoot(scope) });
    },
    onError: (error) => toastActionError(error, t),
  });

  // Una del sistema no tiene ⋮: es de solo lectura. Las demás se duplican (salvo en revisión) y se borran.
  const actions = (template: WhatsAppTemplateResponse): RowAction[] => template.isSystem ? [] : [
    { label: t("whatsapp:templates.duplicate"), accessibleName: t("whatsapp:templates.duplicate"), icon: Copy, hidden: template.status === "Pending", onSelect: (trigger) => setCreating({ original: template, returnFocusTo: trigger }) },
    { label: t("whatsapp:templates.delete"), accessibleName: t("whatsapp:templates.delete"), icon: Trash2, destructive: true, onSelect: (trigger) => setDeleting({ template, returnFocusTo: trigger }) },
  ];
  const rowActions = (template: WhatsAppTemplateResponse) => <RowActions label={t("whatsapp:templates.rowActions", { name: templateTitle(template) })} title={templateTitle(template)} actions={actions(template)} />;
  const columns: Column<WhatsAppTemplateResponse>[] = [
    ...createTemplateColumns(t, setRejected),
    { id: "actions", header: t("whatsapp:templates.columns.actions"), type: "actions", cell: rowActions },
  ];
  const create = () => setCreating({});
  const groupLabel = (value: Group) => t(`enums:WhatsAppTemplateGroup.${value}`);

  return <>
    <Page icon={WhatsAppIcon} title={t("whatsapp:templates.title")} phoneBody="flush" summary={summary}
      fab={{ label: t("whatsapp:templates.create"), onClick: create }}
      actions={<Button type="button" onClick={create}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:templates.create")}</Button>}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        {platform ? <div className="max-md:px-4 max-md:pt-2">
          <SegmentedControl aria-label={t("whatsapp:templates.view")} options={groups.map((value) => ({
            key: value, label: groupLabel(value), detail: groupCount(value), pressed: value === group,
            onSelect: () => filters.setFilter("grupo", value === "System" ? systemValue : undefined),
          }))} />
        </div> : null}
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={list.data?.items ?? []} rowKey={(template) => template.id}
            mobileRow={(template) => templatePhoneRow(template, t, setRejected, rowActions(template))}
            isLoading={list.isPending} isFetching={list.isFetching}
            error={list.error ? apiErrorMessage(list.error, t) : undefined} onRetry={() => { void list.refetch(); }}
            emptyTitle={t("whatsapp:templates.empty")} />
          {listPagination ? <Pagination {...listPagination} /> : null}
        </Surface>
      </div>
    </Page>
    {creating ? <TemplateDialog scope={scope} original={creating.original} returnFocusTo={creating.returnFocusTo} onClose={() => setCreating(null)} /> : null}
    <ImportantNotice open={rejected !== null} onOpenChange={(open) => { if (!open) setRejected(null); }}
      title={t("whatsapp:templates.rejected.title", { name: rejected ? templateTitle(rejected) : "" })}
      reason={rejected?.rejectionReason ?? t("whatsapp:templates.rejected.noReason")}
      detail={rejected ? t("whatsapp:templates.rejected.reviewed", { date: format.formatDate(rejected.updatedAtUtc) }) : undefined}
      steps={[t("whatsapp:templates.rejected.duplicate"), t("whatsapp:templates.rejected.resend")]} />
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
      title={t("whatsapp:templates.confirmDelete", { name: deleting?.template.name ?? "" })} confirmLabel={t("whatsapp:templates.delete")} destructive
      returnFocusTo={deleting?.returnFocusTo} onConfirm={() => { if (deleting) remove.mutate(deleting.template); }} />
  </>;
}

export function OrganizationTemplatesPage() {
  return <TemplatesPage scope="organization" />;
}

export function PlatformTemplatesPage() {
  return <TemplatesPage scope="platform" />;
}
