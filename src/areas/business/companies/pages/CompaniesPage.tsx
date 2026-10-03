import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Pencil, Plus, Power } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import type { CompanyResponse } from "@/shared/api/types";
import type { CreateCompanyRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { TaxIdField, type TaxIdDraft } from "@/shared/ui/fields/TaxIdField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { FilterBar } from "@/shared/ui/FilterBar";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
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
import { createCompanyColumns } from "../columns";

const statusValues = [undefined, "Active", "Inactive"] as const;
type CompanyDraft = { name: string; taxId: TaxIdDraft | null; timeZoneId: string };
const emptyDraft: CompanyDraft = { name: "", taxId: null, timeZoneId: "" };

function draftFromCompany(company: CompanyResponse): CompanyDraft {
  return { name: company.name, taxId: company.taxId ? { type: company.taxId.type, number: company.taxId.number } : null, timeZoneId: company.timeZoneId };
}

// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail ?? fallback : fallback;
}

export function CompaniesPage() {
  const { t } = useTranslation(["companies", "common"]);
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("companies.read") === true;
  const canManage = currentUser?.permissions?.includes("companies.manage") === true;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const filters = useFilters(["status"] as const);
  const pagination = usePagination(undefined, { defaultSort: "name" });
  const debouncedSearch = useDebouncedValue(pagination.search ?? "");
  const statusValue = filters.values.status;
  const status = statusValue === "Active" || statusValue === "Inactive" ? statusValue : undefined;
  const query: CompaniesQuery = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: debouncedSearch || undefined,
    status,
  };
  const companies = useQuery({
    queryKey: companiesQueryKey(query),
    queryFn: () => fetchCompanies(query),
    enabled: canRead,
    placeholderData: keepPreviousData,
    meta: { silent: true },
  });
  const counts = useQuery({
    queryKey: companiesCountQueryKey(debouncedSearch || undefined),
    queryFn: () => fetchCompanyCounts(debouncedSearch || undefined),
    enabled: canRead,
    meta: { silent: true },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyResponse | null>(null);
  const [draft, setDraft] = useState<CompanyDraft>(emptyDraft);
  const [failure, setFailure] = useState<unknown>();
  const [taxIdValid, setTaxIdValid] = useState(true);
  const [statusTarget, setStatusTarget] = useState<CompanyResponse | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
  };
  const finishSave = async (creating: boolean) => {
    setDialogOpen(false);
    toast.success(sentence(t(creating ? "companies:messages.created" : "companies:messages.updated", { name: draft.name.trim() })));
    setEditingCompany(null);
    setDraft(emptyDraft);
    setFailure(undefined);
    await invalidate();
  };
  const create = useIdempotentMutation((request: CreateCompanyRequest, key) => createCompany(request, key));
  const update = useMutation({
    mutationFn: (company: CompanyResponse) => updateCompany(company.id, { name: draft.name.trim(), taxIdType: draft.taxId?.type || null, taxIdNumber: draft.taxId?.number || null, timeZoneId: draft.timeZoneId, version: company.version }),
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
    onError: (error) => toastError(errorMessage(error, t("common:states.error"))),
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  function openCreate() {
    setEditingCompany(null);
    setDraft(emptyDraft);
    setFailure(undefined);
    setTaxIdValid(true);
    setDialogOpen(true);
  }

  function openEdit(company: CompanyResponse) {
    setEditingCompany(company);
    setDraft(draftFromCompany(company));
    setFailure(undefined);
    setTaxIdValid(true);
    setDialogOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim() === "" || !draft.timeZoneId || !taxIdValid) return;
    if (draft.taxId && Boolean(draft.taxId.type) !== Boolean(draft.taxId.number)) {
      setFailure(new Error(t("companies:validation.taxIdPair")));
      return;
    }
    setFailure(undefined);
    const request: CreateCompanyRequest = { name: draft.name.trim(), taxIdType: draft.taxId?.type || null, taxIdNumber: draft.taxId?.number || null, timeZoneId: draft.timeZoneId };
    if (editingCompany) update.mutate(editingCompany);
    else void create.mutateAsync(request).then(() => finishSave(true)).catch((error: unknown) => setFailure(error));
  }

  const columns: Column<CompanyResponse>[] = [
    ...createCompanyColumns(t).slice(0, -1),
    {
      id: "actions", header: t("companies:columns.actions"), type: "actions",
      cell: (company) => <RowActions label={t("companies:rowActions", { name: company.name })} actions={[
        // Tablero Empresas: «Ver ficha», «Editar» y, después de la franja, «Inactivar» en rojo; «Activar» es directo.
        { label: t("companies:actions.view"), accessibleName: t("companies:actions.view"), icon: Eye, onSelect: () => { void navigate(`/org/empresas/${encodeURIComponent(company.id)}`); } },
        { label: t("companies:actions.edit"), accessibleName: t("companies:actions.edit"), icon: Pencil, onSelect: () => openEdit(company), hidden: !canManage },
        { label: t(company.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), accessibleName: t(company.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), icon: Power, destructive: company.status === "Active",
          onSelect: () => { if (company.status === "Active") setStatusTarget(company); else updateStatus.mutate(company); }, hidden: !canManage },
      ]} />,
    },
  ];
  const listSummary = counts.data
    ? `${t("companies:summaryTotal", { count: counts.data.all })} · ${t("companies:summaryActive", { count: counts.data.active })}`
    : companies.data ? t("companies:summaryFallback", { count: companies.data.totalCount, total: companies.data.totalCount }) : undefined;

  return <>
    <Page icon={Building2} title={t("companies:title")} summary={listSummary}
      actions={canManage ? <Button type="button" onClick={openCreate}><Plus aria-hidden="true" className="size-4" />{t("companies:create")}</Button> : undefined}>
      <div className="flex flex-col gap-3">
        <FilterBar
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
        {counts.isError ? <FormError message={errorMessage(counts.error, t("common:states.error"))} /> : null}
        <Surface className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={companies.data?.items ?? []}
            rowKey={(company) => company.id}
            isLoading={companies.isPending}
            isFetching={companies.isFetching}
            error={companies.error ? errorMessage(companies.error, t("common:states.error")) : undefined}
            onRetry={() => { void companies.refetch(); void counts.refetch(); }}
            emptyTitle={status || pagination.search ? t("companies:empty.filtered") : t("companies:empty.all")}
            emptyAction={status || pagination.search ? <Button type="button" variant="outline" onClick={filters.clear}>{t("companies:empty.clear")}</Button> : undefined}
            sort={pagination.sort}
            onSortChange={pagination.toggleSort}
          />
          {companies.data ? <Pagination page={companies.data.page} pageSize={companies.data.pageSize} totalCount={companies.data.totalCount} totalPages={companies.data.totalPages} hasPrevious={companies.data.hasPrevious} hasNext={companies.data.hasNext} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
        </Surface>
      </div>
    </Page>
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFailure(undefined); }}>
      <DialogContent mobileFullHeight>
        <DialogHeader><DialogTitle>{t(editingCompany ? "companies:editTitle" : "companies:createTitle")}</DialogTitle><DialogDescription>{t("companies:form.description")}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {failure ? <FormError message={failure instanceof Error && !(failure instanceof ApiError) ? failure.message : errorMessage(failure, t("common:states.error"))} /> : null}
            <FormField label={t("companies:form.name")} required><Input required maxLength={120} autoComplete="organization" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FormField>
            <FormField label={t("companies:form.taxId")}>
              <TaxIdField value={draft.taxId} onChange={(taxId) => { setDraft({ ...draft, taxId }); setFailure(undefined); }} onValidityChange={setTaxIdValid} typeLabel={t("companies:form.taxIdType")} appliesTo="Company" />
            </FormField>
            <FormField label={t("companies:form.timeZone")} required>
              <TimeZoneSelect variant="compact" value={draft.timeZoneId} onChange={(timeZoneId) => setDraft({ ...draft, timeZoneId })} placeholder={t("companies:form.chooseTimeZone")} />
            </FormField>
          </div>
          <DialogFooter className="border-t border-[var(--borde)] px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button type="submit" disabled={create.isPending || update.isPending || !taxIdValid}>{create.isPending || update.isPending ? t("common:states.saving") : t(editingCompany ? "companies:form.save" : "companies:form.create")}</Button>
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
