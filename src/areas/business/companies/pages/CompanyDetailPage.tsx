import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { BuildingIcon } from "@/shared/ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import type { CompanyStatus } from "@/shared/api/types";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { homeOf } from "@/tenancy/access";
import { changeCompanyStatus, companiesQueryRoot, companyQueryKey, fetchCompany } from "../api/companies";
import { companyStatusTones } from "../columns";
import { AddMemberDialog } from "../components/AddMemberDialog";
import { CompanyDialog } from "../components/CompanyDialog";
import { CompanyMembersTab } from "../tabs/CompanyMembersTab";
import { CompanyRolesTab } from "../tabs/CompanyRolesTab";
import { useCompanyMembers } from "../tabs/useCompanyMembers";
import { useCompanyRoles } from "../tabs/useCompanyRoles";

// «Delta S.A.» + «. Quedaste…» no repite el punto final del nombre.
const sentence = (text: string) => text.replace("..", ".");

type CompanyTab = "members" | "roles";

/// El diálogo abierto de la banda. Uno que abre una opción del ⋮ le devuelve el foco a ese botón al cerrar.
/** Activar o inactivar: el estado al que va, la versión y el nombre de cuando se eligió, nunca los de una relectura (R01). */
type StatusChange = { status: CompanyStatus; version: number; name: string };
type BandDialog = { kind: "addMember" } | { kind: "edit"; returnFocusTo?: HTMLElement | null }
  | { kind: "deactivate"; change: StatusChange; returnFocusTo?: HTMLElement | null };

/**
 * Ficha de Empresa (tableros Empresa y M-Empresa): la banda con el estado, el CUIT y la zona; las acciones de la
 * empresa; y las pestañas Miembros y Roles, cada una con su contenido y sus diálogos (`tabs/`).
 */
export function CompanyDetailPage() {
  const { t } = useTranslation(["companies", "common"]);
  const { companyId } = useParams();
  const id = companyId ?? "";
  const { can, canInCompany } = usePermissions();
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const canManageCompany = can("companies.manage");
  // B4: quien administra solo esta empresa no abre Empresas (`companies.read`); vuelve al Inicio, de donde llegó.
  const back = can("companies.read") ? { to: "/org/empresas", label: t("companies:back") } : { to: homeOf("business"), label: t("companies:backHome") };
  const canReadMembers = canInCompany(id, "company.members.read");
  const canManageMembers = canInCompany(id, "company.members.manage");
  const canReadRoles = can("roles.read");
  const canManageRoles = can("roles.manage");
  const members = useCompanyMembers(id, canReadMembers);
  const roles = useCompanyRoles(id, { canReadRoles, canReadMembers });
  const company = useQuery({ queryKey: companyQueryKey(id), queryFn: () => fetchCompany(id), enabled: Boolean(id), meta: { silent: true, blocksView: true } });
  useBreadcrumbLeaf(company.data?.name);
  const [tab, setTab] = useState<CompanyTab>("members");
  const [dialog, setDialog] = useState<BandDialog | null>(null);
  const changeCompanyState = useMutation({
    mutationFn: ({ status, version }: StatusChange) => changeCompanyStatus(id, { status, version }),
    onSuccess: async (_result, change) => {
      setDialog(null);
      toast.success(sentence(t(change.status === "Inactive" ? "companies:messages.deactivated" : "companies:messages.activated", { name: change.name })));
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: (error) => toastActionError(error, t),
  });

  if (company.isPending) return <Page icon={BuildingIcon} title={t("companies:detail.loading")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): la ficha no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (!company.data) return isNotFoundError(company.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("companies:detail.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void company.refetch(); }} screen={t("companies:detail.title")} back={back} />;
  const data = company.data;
  const canAdd = canManageMembers && data.status === "Active";
  const createRolePath = `/org/roles/nuevo?scope=SpecificCompany&companyId=${encodeURIComponent(id)}`;
  const closeDialog = () => setDialog(null);

  return <>
    <Page icon={BuildingIcon} title={data.name} backTo={back}
      phoneBody="flush"
      // Tablero M-Empresa: debajo del título, el CUIT y la zona; crear es un «+» flotante según la pestaña.
      phoneSubtitle={<>{data.taxId ? <><TaxIdText value={data.taxId} withType />{" · "}</> : null}<TimeZoneText value={data.timeZoneId} /></>}
      fab={tab === "members"
        ? canAdd ? { label: t("companies:actions.addMember"), onClick: () => setDialog({ kind: "addMember" }) } : undefined
        : canManageRoles ? { label: t("companies:detail.createRole"), to: createRolePath } : undefined}
      // Tablero Empresa: el estado primero, con punto y palabra; después el CUIT y la zona, formateados.
      summary={<>
        <StatusBadge tones={companyStatusTones} value={data.status} /><SublineSeparator />
        {data.taxId ? <><TaxIdText value={data.taxId} withType /><span aria-hidden="true">{" · "}</span></> : null}
        <TimeZoneText value={data.timeZoneId} />
      </>}
      actions={<>
        {canManageCompany ? <Button type="button" variant="outline" onClick={() => setDialog({ kind: "edit" })}>{t("companies:actions.editCompany")}</Button> : null}
        {canAdd && tab === "members" ? <Button type="button" onClick={() => setDialog({ kind: "addMember" })}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("companies:actions.addMember")}</Button> : null}
        {canManageRoles && tab === "roles" ? <Button asChild><Link to={createRolePath}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("companies:detail.createRole")}</Link></Button> : null}
      </>}
      moreActions={canManageCompany ? { label: t("companies:actions.more"), items: [
        { label: t("companies:actions.editCompany"), onSelect: (trigger) => setDialog({ kind: "edit", returnFocusTo: trigger }), hidden: !phone },
        { label: t(data.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), destructive: data.status === "Active",
          onSelect: (trigger) => {
            const change: StatusChange = { status: data.status === "Active" ? "Inactive" : "Active", version: data.version, name: data.name };
            if (change.status === "Inactive") setDialog({ kind: "deactivate", change, returnFocusTo: trigger }); else changeCompanyState.mutate(change);
          } },
      ] } : undefined}
      // Tablero Empresa: las pestañas abren el contenido, debajo de la banda, con la cantidad en gris. Quien no lee los roles
      // de la organización (el Administrador de empresa) ve un solo grupo, Miembros, y la ficha va sin la barra (Page).
      tabs={{ label: t("companies:detail.tabsLabel"), value: tab, onValueChange: (value) => setTab(value as CompanyTab), items: [
        { value: "members", label: t("companies:detail.members"), count: members.result.data?.totalCount ?? data.memberCount,
          className: "flex flex-col gap-3 md:gap-4", content: <CompanyMembersTab company={data} list={members} roles={roles.assignable} /> },
        { value: "roles", label: t("companies:detail.roles"), count: roles.ownCount, hidden: !canReadRoles, content: <CompanyRolesTab roles={roles} /> },
      ] }} />

    {/* Cada diálogo se monta solo mientras está abierto, es dueño de su borrador y de su error y devuelve el foco. */}
    {dialog?.kind === "addMember" ? <AddMemberDialog companyId={id} roles={roles.assignable} onClose={closeDialog} /> : null}
    {dialog?.kind === "edit" ? <CompanyDialog company={data} inDetail returnFocusTo={dialog.returnFocusTo} onClose={closeDialog} /> : null}
    {dialog?.kind === "deactivate" ? <ConfirmDialog open onOpenChange={(open) => { if (!open) closeDialog(); }}
      title={t("companies:confirm.deactivate", { name: dialog.change.name })}
      description={t("companies:confirm.deactivateDescription")}
      confirmLabel={t("companies:confirm.deactivateConfirm")} destructive returnFocusTo={dialog.returnFocusTo}
      onConfirm={() => changeCompanyState.mutate(dialog.change)} /> : null}
  </>;
}
