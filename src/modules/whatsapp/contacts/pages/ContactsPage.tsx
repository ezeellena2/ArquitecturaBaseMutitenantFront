import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { EyeIcon, PencilIcon } from "@/shared/ui/icons";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { ContactsIcon } from "../../components/icons";
import type { WhatsAppConsent, WhatsAppContactResponse } from "../../api/types";
import { contactsQueryKey, contactTagOptions, fetchContacts, tagMaxLength, type ContactsQuery } from "../api/contacts";
import { contactPath, contactPhoneRow, createContactColumns } from "../columns";
import { EditContactDialog } from "../components/EditContactDialog";
import { ImportContactsDialog } from "../components/ImportContactsDialog";
import { countOf } from "../../lib/values";

const contactFilterKeys = ["tag", "consent"] as const;
// Orden del filtro «Promociones» del tablero WA-Contactos: todas y después cada respuesta.
const consents: readonly (WhatsAppConsent | undefined)[] = [undefined, "Accepted", "Declined", "NoAnswer", "Unsubscribed"];
const allValue = "all";

type ContactDialog = { kind: "import"; returnFocusTo?: HTMLElement | null } | { kind: "edit"; contact: WhatsAppContactResponse; returnFocusTo?: HTMLElement | null };

/**
 * Contactos (tableros WA-Contactos, M-WA-Contactos e Importar): la banda con cuántos hay y cuántos aceptan promociones,
 * el buscador con los filtros «Etiqueta» y «Promociones» en la URL y la tabla paginada por el back. En el teléfono, la
 * lupa y el filtro van en la barra con «Importar» en texto.
 */
export function ContactsPage(_props: ModuleContentProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const navigate = useNavigate();
  const { filters, pagination, query, result: contacts, paginationProps } = usePagedQuery({
    filterKeys: contactFilterKeys,
    // Una etiqueta más larga que el límite (una URL escrita a mano) no existe: no filtra.
    toQuery: (page, values): ContactsQuery => ({ ...page, tag: values.tag && values.tag.length <= tagMaxLength ? values.tag : undefined, consent: consents.find((consent) => consent !== undefined && consent === values.consent) }),
    queryKey: contactsQueryKey, queryFn: (contactsQuery) => fetchContacts(contactsQuery), meta: { silent: true, blocksView: true },
  });
  const tags = useResourceOptions(contactTagOptions);
  const [dialog, setDialog] = useState<ContactDialog | null>(null);
  const filtered = Boolean(query.tag || query.consent || pagination.search);
  const summary = contacts.data?.summary;

  const rowActions = (contact: WhatsAppContactResponse) => {
    const name = contact.name ?? (format.isLoading ? contact.displayNumber : format.formatPhone(contact.displayNumber));
    return <RowActions label={t("whatsapp:contacts.rowActions", { name })} title={name} actions={[
      { label: t("whatsapp:contacts.actions.view"), accessibleName: t("whatsapp:contacts.actions.view"), icon: EyeIcon, onSelect: () => { void navigate(contactPath(contact.id)); } },
      { label: t("whatsapp:contacts.actions.edit"), accessibleName: t("whatsapp:contacts.actions.edit"), icon: PencilIcon, onSelect: (trigger) => setDialog({ kind: "edit", contact, returnFocusTo: trigger }) },
    ]} />;
  };
  const columns: Column<WhatsAppContactResponse>[] = [
    ...createContactColumns(t),
    { id: "actions", header: t("whatsapp:contacts.columns.actions"), type: "actions", cell: rowActions },
  ];
  const openImport = () => setDialog({ kind: "import" });

  return <>
    <Page icon={ContactsIcon} title={t("whatsapp:contacts.title")} phoneBody="flush"
      summary={summary ? <><span>{t("whatsapp:contacts.summaryTotal", countOf(format, summary.total))}</span><SublineSeparator /><span>{t("whatsapp:contacts.summaryAccepting", countOf(format, summary.accepting))}</span></> : undefined}
      // M-WA-Contactos: «Importar» en texto en la barra; en la compu, el botón principal de la banda.
      barAction={phone ? { label: t("whatsapp:contacts.import.short"), onClick: openImport } : undefined}
      actions={phone ? undefined : <Button type="button" onClick={openImport}>{t("whatsapp:contacts.import.open")}</Button>}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar label={t("whatsapp:contacts.filters.label")} searchLabel={t("whatsapp:contacts.filters.search")}
          searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
          filters={[
            { key: "tag", label: t("whatsapp:contacts.filters.tag"), menuLabel: t("whatsapp:contacts.filters.tagMenu"), remote: tags.remote,
              selectedLabel: query.tag, value: query.tag ?? "", active: query.tag !== undefined,
              onChange: (value) => filters.setFilter("tag", value === allValue ? undefined : value),
              options: [{ value: allValue, label: t("whatsapp:contacts.filters.allTags") }, ...tags.items.map((tag) => ({ value: tag, label: tag }))] },
            { key: "consent", label: t("whatsapp:contacts.filters.consent"), menuLabel: t("whatsapp:contacts.filters.consentMenu"),
              value: query.consent ?? "", active: query.consent !== undefined,
              onChange: (value) => filters.setFilter("consent", value === allValue ? undefined : value),
              options: consents.map((consent) => ({ value: consent ?? allValue, label: consent ? format.formatEnum("WhatsAppConsent", consent) : t("whatsapp:contacts.filters.allConsents") })) },
          ]}
          clearLabel={t("common:actions.clearFilters")} onClear={filters.clear} />
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={columns} rows={contacts.data?.items ?? []} rowKey={(contact) => contact.id}
            mobileRow={(contact) => contactPhoneRow(contact, t)}
            isLoading={contacts.isPending} isFetching={contacts.isFetching}
            error={contacts.error ? apiErrorMessage(contacts.error, t) : undefined} onRetry={() => { void contacts.refetch(); }}
            emptyTitle={filtered ? t("whatsapp:contacts.empty.filtered") : t("whatsapp:contacts.empty.all")}
            emptyAction={filtered ? <Button type="button" variant="outline" onClick={filters.clear}>{t("common:actions.clearFilters")}</Button> : undefined} />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>

    {dialog?.kind === "import" ? <ImportContactsDialog returnFocusTo={dialog.returnFocusTo} onClose={() => setDialog(null)} /> : null}
    {dialog?.kind === "edit" ? <EditContactDialog contact={dialog.contact} returnFocusTo={dialog.returnFocusTo} onClose={() => setDialog(null)} /> : null}
  </>;
}
