import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { homeOf } from "@/tenancy/access";
import { changeCompanyStatus, companiesQueryRoot, companyQueryKey, fetchCompany } from "../api/companies";
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
type BandDialog = { kind: "addMember" } | { kind: "edit" | "deactivate"; returnFocusTo?: HTMLElement | null };

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
    mutationFn: () => changeCompanyStatus(id, { status: company.data?.status === "Active" ? "Inactive" : "Active", version: company.data?.version }),
    onSuccess: async () => {
      setDialog(null);
      toast.success(sentence(t(company.data?.status === "Active" ? "companies:messages.deactivated" : "companies:messages.activated", { name: company.data?.name ?? "" })));
      await queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
    },
    onError: (error) => toastActionError(error, t),
  });

  if (company.isPending) return <Page icon={Building2} title={t("companies:detail.loading")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  // «Criterio · Avisos» (Pantalla de error): la ficha no cargó y no hay nada que mostrar; si no existe (404),
  // «No encontramos esta página» (errores.md).
  if (!company.data) return isNotFoundError(company.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("companies:detail.title")} back={{ to: "/org/empresas", label: t("companies:back") }} />
    : <LoadErrorPage onRetry={() => { void company.refetch(); }} screen={t("companies:detail.title")} back={{ to: "/org/empresas", label: t("companies:back") }} />;
  const data = company.data;
  const canAdd = canManageMembers && data.status === "Active";
  const createRolePath = `/org/roles/nuevo?scope=SpecificCompany&companyId=${encodeURIComponent(id)}`;
  const closeDialog = () => setDialog(null);

  return <>
    <Tabs value={tab} onValueChange={(value) => setTab(value as CompanyTab)} className="contents!">
    <Page icon={Building2} title={data.name} backTo={{ to: "/org/empresas", label: t("companies:back") }}
      phoneBody="flush"
      // Tablero M-Empresa: debajo del título, el CUIT y la zona; crear es un «+» flotante según la pestaña.
      phoneSubtitle={<>{data.taxId ? <><TaxIdText value={data.taxId} withType />{" · "}</> : null}<TimeZoneText value={data.timeZoneId} /></>}
      fab={tab === "members"
        ? canAdd ? { label: t("companies:actions.addMember"), onClick: () => setDialog({ kind: "addMember" }) } : undefined
        : canManageRoles ? { label: t("companies:detail.createRole"), to: createRolePath } : undefined}
      // Tablero Empresa: el estado primero, con punto y palabra; después el CUIT y la zona, formateados.
      summary={<>
        <span className="inline-flex items-center gap-1.5 text-[var(--t1)]"><span aria-hidden="true" className={`size-2 rounded-full ${data.status === "Active" ? "bg-[var(--punto-ok)]" : "bg-[var(--punto-apagado)]"}`} />{t(`companies:status.${data.status}`)}</span>
        {data.taxId ? <><span aria-hidden="true">{" · "}</span><TaxIdText value={data.taxId} withType /></> : null}
        <span aria-hidden="true">{" · "}</span><TimeZoneText value={data.timeZoneId} />
      </>}
      actions={<>
        {canManageCompany ? <Button type="button" variant="outline" onClick={() => setDialog({ kind: "edit" })}>{t("companies:actions.editCompany")}</Button> : null}
        {canAdd && tab === "members" ? <Button type="button" onClick={() => setDialog({ kind: "addMember" })}><Plus aria-hidden="true" className="size-4" />{t("companies:actions.addMember")}</Button> : null}
        {canManageRoles && tab === "roles" ? <Button asChild><Link to={createRolePath}><Plus aria-hidden="true" className="size-4" />{t("companies:detail.createRole")}</Link></Button> : null}
      </>}
      moreActions={canManageCompany ? { label: t("companies:actions.more"), items: [
        { label: t("companies:actions.editCompany"), onSelect: (trigger) => setDialog({ kind: "edit", returnFocusTo: trigger }), hidden: !phone },
        { label: t(data.status === "Active" ? "companies:actions.deactivate" : "companies:actions.activate"), destructive: data.status === "Active",
          onSelect: (trigger) => { if (data.status === "Active") setDialog({ kind: "deactivate", returnFocusTo: trigger }); else changeCompanyState.mutate(); } },
      ] } : undefined}
      // Tablero Empresa: las pestañas abren el contenido, debajo de la banda, con la cantidad en gris.
      tabs={<TabsList aria-label={t("companies:detail.tabsLabel")}>
        <TabsTrigger value="members">{t("companies:detail.members")}<TabCount>{members.result.data?.totalCount ?? data.memberCount}</TabCount></TabsTrigger>
        {canReadRoles ? <TabsTrigger value="roles">{t("companies:detail.roles")}<TabCount>{roles.own.length}</TabCount></TabsTrigger> : null}
      </TabsList>}>
        <TabsContent value="members" className="flex flex-col gap-3 md:gap-4">
          <CompanyMembersTab company={data} list={members} roles={roles.assignable} />
        </TabsContent>
        {canReadRoles ? <TabsContent value="roles"><CompanyRolesTab roles={roles} /></TabsContent> : null}
    </Page>
    </Tabs>

    {/* Cada diálogo se monta solo mientras está abierto, es dueño de su borrador y de su error y devuelve el foco. */}
    {dialog?.kind === "addMember" ? <AddMemberDialog companyId={id} roles={roles.assignable} onClose={closeDialog} /> : null}
    {dialog?.kind === "edit" ? <CompanyDialog company={data} inDetail returnFocusTo={dialog.returnFocusTo} onClose={closeDialog} /> : null}
    {dialog?.kind === "deactivate" ? <ConfirmDialog open onOpenChange={(open) => { if (!open) closeDialog(); }}
      title={t("companies:confirm.deactivate", { name: data.name })}
      description={t("companies:confirm.deactivateDescription")}
      confirmLabel={t("companies:confirm.deactivateConfirm")} destructive returnFocusTo={dialog.returnFocusTo}
      onConfirm={() => changeCompanyState.mutate()} /> : null}
  </>;
}
