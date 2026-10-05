import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Pencil, Plus, Power } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { usePermissions } from "@/auth/usePermissions";
import { actionErrorMessage, apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { CompanyResponse } from "@/shared/api/types";
import type { CreateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { toast } from "sonner";
import {
  changeCompanyStatus,
  companiesCountQueryKey,
  companiesQueryKey,
  companiesQueryRoot,
  createCompany,
  fetchCompanies,
  fetchCompanyCounts,
  updateCompany,
  type CompaniesQuery,
} from "../api/companies";
import { createCompanyColumns, companyPhoneRow } from "../columns";
import { CompanyFields, companyPayload, draftFromCompany, emptyCompanyDraft, useCompanyValidation, type CompanyDraft } from "../components/CompanyFields";

const statusValues = [undefined, "Active", "Inactive"] as const;
const companyFilterKeys = ["status"] as const;

// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");

export function CompaniesPage() {
  const { t } = useTranslation(["companies", "common"]);
  const { can } = usePermissions();
  const canManage = can("companies.manage");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { filters, pagination, query, result: companies, paginationProps } = usePagedQuery({
    filterKeys: companyFilterKeys,
    defaultSort: "name",
    toQuery: (page, values): CompaniesQuery => ({
      ...page,
      status: values.status === "Active" || values.status === "Inactive" ? values.status : undefined,
    }),
    queryKey: companiesQueryKey, queryFn: fetchCompanies, meta: { silent: true, blocksView: true },
  });
  const { status } = query;
  const debouncedSearch = query.search ?? undefined;
  const counts = useQuery({
    queryKey: companiesCountQueryKey(debouncedSearch),
    queryFn: () => fetchCompanyCounts(debouncedSearch),
    meta: { silent: true },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyResponse | null>(null);
  const [draft, setDraft] = useState<CompanyDraft>(emptyCompanyDraft);
  const [failure, setFailure] = useState<unknown>();
  const validation = useCompanyValidation(draft);
  const { cuitType } = validation;
  const [statusTarget, setStatusTarget] = useState<CompanyResponse | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
  };
  const finishSave = async (creating: boolean) => {
    setDialogOpen(false);
    toast.success(sentence(t(creating ? "companies:messages.created" : "companies:messages.updated", { name: draft.name.trim() })));
    setEditingCompany(null);
    setDraft(emptyCompanyDraft);
    setFailure(undefined);
    await invalidate();
  };
  const create = useIdempotentMutation((request: CreateCompanyRequest, key) => createCompany(request, key));
  const update = useMutation({
    mutationFn: (company: CompanyResponse) => updateCompany(company.id, { ...companyPayload(draft, cuitType?.code), version: company.version }),
    onSuccess: async () => finishSave(false),
    onError: (error) => setFailure(error),
  });
  const updateStatus = useMutation({
    mutationFn: (company: CompanyResponse) => changeCompanyStatus(company.id, { status: company.status === "Active" ? "Inactive" : "Active", version: company.version }),
    onSuccess: async (_result, company) => {
      setStatusTarget(null);
      toast.success(sentence(t(company.status === "Active" ? "companies:messages.deactivated" : "companies:messages.activated", { name: company.name })));
      await invalidate();
    },
    onError: (error) => toastActionError(error, t),
  });

  function openCreate() {
    setEditingCompany(null);
    setDraft(emptyCompanyDraft);
    setFailure(undefined);
    validation.reset();
    setDialogOpen(true);
  }

  function openEdit(company: CompanyResponse) {
    setEditingCompany(company);
    setDraft(draftFromCompany(company));
    setFailure(undefined);
    validation.reset();
    setDialogOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // «Criterio · Formularios»: el nombre y el CUIT se revisan al tocar el botón; lo que falta lo dice el campo.
    if (!validation.validate()) return;
    setFailure(undefined);
    const request: CreateCompanyRequest = companyPayload(draft, cuitType?.code);
    if (editingCompany) update.mutate(editingCompany);
    else create.mutate(request, { onSuccess: () => finishSave(true), onError: setFailure });
  }

  const rowActions = (company: CompanyResponse) => <RowActions label={t("companies:rowActions", { name: company.name })} actions={[
        // Tablero Empresas: «Ver ficha», «Editar» y, después de la franja, «Inactivar» en rojo; «Activar» es directo.
        { label: t("companies:actions.view"), accessibleName: t("companies:actions.view"), icon: Eye, onSelect: () => { void navigate(`/org/empresas/${encodeURIComponent(company.id)}`); } },
        { label: t("companies:actions.edit"), accessibleName: t("companies:actions.edit"), icon: Pencil, onSelect: () => openEdit(company), hidden: !canManage },
        { label: t(company.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), accessibleName: t(company.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), icon: Power, destructive: company.status === "Active",
          onSelect: () => { if (company.status === "Active") setStatusTarget(company); else updateStatus.mutate(company); }, hidden: !canManage },
      ]} />;
  const columns: Column<CompanyResponse>[] = [
    ...createCompanyColumns(t),
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: rowActions },
  ];
  const listSummary = counts.data
    ? `${t("companies:summaryTotal", { count: counts.data.all })} · ${t("companies:summaryActive", { count: counts.data.active })}`
    : companies.data ? t("companies:summaryFallback", { count: companies.data.totalCount, total: companies.data.totalCount }) : undefined;

  return <>
    <Page icon={Building2} title={t("companies:title")} summary={listSummary} phoneBody="flush"
      fab={canManage ? { label: t("companies:create"), onClick: openCreate } : undefined}
      actions={canManage ? <Button type="button" onClick={openCreate}><Plus aria-hidden="true" className="size-4" />{t("companies:create")}</Button> : undefined}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar phoneTools="filter"
          label={t("companies:filters.label")}
          searchLabel={t("companies:filters.search")}
          searchValue={pagination.search ?? ""}
          onSearchChange={pagination.setSearch}
          filters={[{
            key: "status", label: t("companies:filters.status"), menuLabel: t("companies:filters.status"),
            // Sin filtro el botón dice «Estado: todas» y el menú ofrece «Todas», como el tablero.
            value: status ?? "", active: status !== undefined,
            onChange: (value) => filters.setFilter("status", value === "all" ? undefined : value),
            options: statusValues.map((value) => ({ value: value ?? "all", label: value ? t(`companies:statusFilters.${value}`) : t("companies:filters.all"), count: value === "Active" ? counts.data?.active : value === "Inactive" ? counts.data?.inactive : counts.data?.all })),
          }]}
          clearLabel={t("common:actions.clear")}
          onClear={filters.clear}
        />
        {counts.isError ? <FormError message={apiErrorMessage(counts.error, t)} /> : null}
        <Surface className="overflow-hidden" phoneFlush>
          <DataTable
            columns={columns}
            mobileRow={(company) => companyPhoneRow(company, t, rowActions(company))}
            rows={companies.data?.items ?? []}
            rowKey={(company) => company.id}
            isLoading={companies.isPending}
            isFetching={companies.isFetching}
            error={companies.error ? apiErrorMessage(companies.error, t) : undefined}
            onRetry={() => { void companies.refetch(); void counts.refetch(); }}
            emptyTitle={status || pagination.search ? t("companies:empty.filtered") : t("companies:empty.all")}
            emptyAction={status || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("companies:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {paginationProps ? <Pagination {...paginationProps} /> : null}
        </Surface>
      </div>
    </Page>
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFailure(undefined); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t(editingCompany ? "companies:editTitle" : "companies:createTitle")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogBody>
            <CompanyFields draft={draft} onChange={(next) => { setDraft(next); setFailure(undefined); }} errors={validation.errors} />
            {/* «Criterio · Diálogos»: el error general, en la franja arriba de los botones. */}
            <FormError message={actionErrorMessage(failure, t)} />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("common:actions.cancel")}</Button>
            {/* «Criterio · Botones»: no se apaga con el CUIT mal; el campo ya dice qué corregir y no se manda nada. */}
            <Button type="submit" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? t("common:states.saving") : t(editingCompany ? "companies:form.save" : "companies:form.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={statusTarget !== null}
      onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
      title={statusTarget ? t("companies:confirm.deactivate", { name: statusTarget.name }) : ""}
      description={t("companies:confirm.deactivateDescription")}
      confirmLabel={t("companies:confirm.deactivateConfirm")}
      destructive
      onConfirm={() => { if (statusTarget) updateStatus.mutate(statusTarget); }}
    />
  </>;
}
