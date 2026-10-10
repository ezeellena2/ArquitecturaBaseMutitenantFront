import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { toast } from "sonner";
import { usePermissions } from "@/auth/usePermissions";
import { isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import type { PlatformTenantDetailResponse, TenantStatus, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { maskEmail } from "@/shared/format/personalData";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { BuildingIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { homeOf } from "@/tenancy/access";
import { useModuleHome } from "@/shared/modules/useModules";
import { changeTenantState, fetchTenant, fetchTenantDomains, fetchTenantFeatures, fetchTenantPublicPage, retryTenantProvisioning, tenantDomainsQueryKey, tenantFeaturesQueryKey, tenantPublicPageQueryKey, tenantQueryKey, tenantsQueryRoot, type TenantAction } from "../api/tenants";
import { organizationOwners, tenantStatusTones } from "../columns";
import { isTenantStateConflict, tenantStateConflictCodes } from "../errors";
import { OrganizationHistoryTab } from "../tabs/OrganizationHistoryTab";
import { OrganizationOwnersTab } from "../tabs/OrganizationOwnersTab";
import { OrganizationModulesTab, type OwnFeatureWrite } from "../tabs/OrganizationModulesTab";
import { OrganizationDomainTab, type OwnDomainWrite } from "../tabs/OrganizationDomainTab";
import { OrganizationPublicPageTab, type OwnPublicPageWrite } from "../tabs/OrganizationPublicPageTab";

const nextStatus: Record<TenantAction, TenantStatus> = { approve: "Active", reject: "Closed", suspend: "Suspended", reactivate: "Active", close: "Closed" };
interface OwnWrite { version: number; status: TenantStatus }
interface Confirmation { organization: PlatformTenantDetailResponse; action: TenantAction; trigger: HTMLElement | null }
interface StateOperation { id: string; action: TenantAction; version: number; reason: string }

// Copia el recorrido T21b: cada formulario montado es dueño de su clave y se aborta al cancelar/desmontar.
function OrganizationStateDialog({ confirmation, onClose, onSuccess }: { confirmation: Confirmation; onClose: (conflicted: boolean) => void; onSuccess: (response: VersionResponse) => void }) {
  const { t } = useTranslation("platformTenants");
  const conflict = useRef(false);
  const action = useIdempotentMutation((operation: StateOperation, key) => changeTenantState(operation.id, operation.action, { version: operation.version, reason: operation.reason }, key), {
    meta: { handlesError: true },
    sameOperation: (previous, next) => previous.id === next.id && previous.action === next.action && previous.version === next.version && previous.reason === next.reason,
  });
  return <ReasonDialog title={t(`confirm.${confirmation.action}.title`, { name: confirmation.organization.name })}
    description={t(`confirm.${confirmation.action}.description`, { owner: confirmation.organization.ownerName || confirmation.organization.ownerEmail || "", email: maskEmail(confirmation.organization.ownerEmail ?? "") })}
    confirmLabel={t(`actions.${confirmation.action}`)} pendingLabel={t(`confirm.${confirmation.action}.pending`)} destructive={["reject", "suspend", "close"].includes(confirmation.action)}
    queryRoot={tenantsQueryRoot} stateConflictCodes={tenantStateConflictCodes} returnFocusTo={confirmation.trigger} onClose={() => onClose(conflict.current)}
    mutationFn={async (values) => {
      try { return await action.mutateAsync({ id: confirmation.organization.id, action: confirmation.action, version: confirmation.organization.version, reason: values.reason }); }
      catch (error) { if (isTenantStateConflict(error)) conflict.current = true; throw error; }
    }} onSuccess={onSuccess} />;
}

export function OrganizationPage() {
  const { id = "" } = useParams();
  return <OrganizationDetail key={id} id={id} />;
}

function OrganizationDetail({ id }: { id: string }) {
  const { t } = useTranslation(["platformTenants", "common"]);
  const { canPlatform } = usePermissions();
  const { phone } = useAppChrome();
  const moduleHome = useModuleHome("platform");
  const format = useFormat();
  const client = useQueryClient();
  const canManage = canPlatform("platform.tenants.manage");
  const organization = useQuery({ queryKey: tenantQueryKey(id), queryFn: () => fetchTenant(id), enabled: Boolean(id) && canPlatform("platform.tenants.read"), meta: { silent: true, blocksView: true } });
  useBreadcrumbLeaf(organization.data?.name);
  const [tab, setTab] = useState("history");
  const features = useQuery({ queryKey: tenantFeaturesQueryKey(id), queryFn: () => fetchTenantFeatures(id), enabled: Boolean(organization.data), meta: { silent: true } });
  // Estas lecturas registran la entrada al alcance privado: jamás se anticipan para contar pestañas.
  const domains = useQuery({ queryKey: tenantDomainsQueryKey(id), queryFn: () => fetchTenantDomains(id), enabled: canManage && Boolean(organization.data) && tab === "domains", meta: { silent: true } });
  const publicPage = useQuery({ queryKey: tenantPublicPageQueryKey(id), queryFn: () => fetchTenantPublicPage(id), enabled: canManage && Boolean(organization.data) && tab === "publicPage", meta: { silent: true } });
  const [featureWrites, setFeatureWrites] = useState(() => new Map<string, OwnFeatureWrite>());
  const [moduleWrites, setModuleWrites] = useState(() => new Map<string, unknown>());
  const [domainWrites, setDomainWrites] = useState(() => new Map<string, OwnDomainWrite>());
  const [publicPageWrite, setPublicPageWrite] = useState<OwnPublicPageWrite>();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [ownWrites, setOwnWrites] = useState(() => new Map<string, OwnWrite>());
  const invalidate = () => client.invalidateQueries({ queryKey: tenantsQueryRoot });
  function wrote(version: number, status: TenantStatus) {
    setOwnWrites((previous) => new Map(previous).set(id, { version, status }));
    // La respuesta sólo trae versión: no inventa cuándo cambió ni reutiliza un evento anterior.
    client.setQueryData<PlatformTenantDetailResponse>(tenantQueryKey(id), (data) => data ? { ...data, version, status, lastStateChange: null } : data);
  }
  const retry = useIdempotentMutation((data: PlatformTenantDetailResponse, key) => retryTenantProvisioning(data.id, { version: data.version }, key), { sameOperation: (previous, next) => previous.id === next.id && previous.version === next.version });
  const back = { to: moduleHome ? "/plataforma/organizaciones" : homeOf("platform"), label: t("platformTenants:detail.back") };
  if (organization.isPending) return <Page icon={BuildingIcon} title={t("platformTenants:detail.loading")} backTo={back}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  if (!organization.data) return isNotFoundError(organization.error)
    ? <NotFoundPage homePath={homeOf("platform")} screen={t("platformTenants:detail.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void organization.refetch(); }} screen={t("platformTenants:detail.title")} back={back} />;
  const written = ownWrites.get(id);
  const data = written ? { ...organization.data, ...written, lastStateChange: organization.data.status === written.status ? organization.data.lastStateChange : null } : organization.data;
  const open = (action: TenantAction, trigger: HTMLElement | null) => setConfirmation({ organization: data, action, trigger });
  const retryProvisioning = () => retry.mutate(data, { onSuccess: (response) => { wrote(response.version, "Active"); toast.success(t("platformTenants:messages.retried", { name: data.name })); void invalidate(); }, onError: (error) => toastActionError(error, t) });
  const actions = canManage ? data.status === "PendingApproval" ? ["reject", "approve"] as const : data.status === "Active" ? ["suspend"] as const : data.status === "Suspended" ? ["reactivate", "close"] as const : [] : [];
  const counts = data.companyCount === 0 ? t("platformTenants:columns.noCompanies") : t("platformTenants:detail.counts", { companies: format.formatInteger(data.companyCount), companyLabel: t("platformTenants:columns.company", { count: data.companyCount }), members: format.formatInteger(data.memberCount), memberLabel: t("platformTenants:columns.member", { count: data.memberCount }) });
  const banner = data.status === "Suspended" || data.status === "Closed" ? <Banner tone={data.status === "Suspended" ? "warning" : "info"}>
    <strong>{t(`platformTenants:detail.banner.${data.status}`)} <DateText value={data.lastStateChange?.atUtc} />{"."}{data.status === "Closed" ? ` ${t("platformTenants:detail.readOnly")}` : null}</strong>{" "}{t("platformTenants:detail.reason")} {data.lastStateChange?.reason || <EmptyValue />}
  </Banner> : undefined;
  return <>
    <Page icon={BuildingIcon} title={data.name} backTo={back} phoneBody="flush" banner={banner}
      summary={<><StatusBadge tones={tenantStatusTones} value={data.status} /><SublineSeparator /><span>{t(data.status === "PendingApproval" || data.status === "Provisioning" ? "platformTenants:detail.requested" : "platformTenants:detail.created")} <DateText value={data.createdAtUtc} /> {t(`platformTenants:detail.source.${data.source}`)}{" · "}{counts}</span></>}
      phoneSubtitle={<><StatusBadge tones={tenantStatusTones} value={data.status} />{" · "}{counts}</>}
      actions={!phone && canManage ? <>{actions.map((action) => <Button key={action} variant={action === "reject" || action === "close" ? "danger" : action === "approve" ? "default" : "outline"} onClick={(event) => open(action, event.currentTarget)}>{t(`platformTenants:actions.${action}`)}</Button>)}{data.status === "Provisioning" ? <Button pending={retry.isPending} onClick={retryProvisioning}>{t("platformTenants:actions.retry")}</Button> : null}</> : undefined}
      moreActions={phone && canManage ? { label: t("platformTenants:rowActions", { name: data.name }), items: [...actions.map((action) => ({ label: t(`platformTenants:actions.${action}`), destructive: ["reject", "suspend", "close"].includes(action), onSelect: (trigger: HTMLButtonElement | null) => open(action, trigger) })), ...(data.status === "Provisioning" ? [{ label: t("platformTenants:actions.retry"), onSelect: retryProvisioning }] : [])] } : undefined}
      tabs={{ label: t("platformTenants:detail.tabsLabel"), value: tab, onValueChange: setTab, items: [
        { value: "history", label: t("platformTenants:detail.history"), content: <OrganizationHistoryTab id={id} /> },
        { value: "owners", label: t("platformTenants:detail.owners"), count: organizationOwners(data).length, content: <OrganizationOwnersTab organization={data} /> },
        { value: "modules", label: t("platformTenants:modules.title"), count: features.data?.length, hidden: features.data?.length === 0,
          content: <OrganizationModulesTab organization={data} query={features} writes={featureWrites} onWrite={(key, write) => setFeatureWrites((previous) => new Map(previous).set(key, write))}
            moduleWrites={moduleWrites} onModuleWrite={(key, write) => setModuleWrites((previous) => new Map(previous).set(key, write))}
            onModuleConflict={(key) => setModuleWrites((previous) => { const next = new Map(previous); next.delete(key); return next; })}
            onConflict={(key) => setFeatureWrites((previous) => { const next = new Map(previous); next.delete(key); return next; })} /> },
        { value: "domains", label: t("platformTenants:domains.title"), hidden: !canManage,
          content: <OrganizationDomainTab organization={data} query={domains} writes={domainWrites} onWrite={(domain, write) => setDomainWrites((previous) => new Map(previous).set(domain, write))}
            onConflict={(domain) => setDomainWrites((previous) => { const next = new Map(previous); next.delete(domain); return next; })} /> },
        { value: "publicPage", label: t("platformTenants:publicPage.title"), hidden: !canManage,
          content: <OrganizationPublicPageTab organization={data} query={publicPage} write={publicPageWrite} onWrite={setPublicPageWrite} onConflict={() => setPublicPageWrite(undefined)} /> },
      ] }} />
    {confirmation ? <OrganizationStateDialog confirmation={confirmation} onClose={(conflicted) => {
      if (conflicted) setOwnWrites((previous) => { const next = new Map(previous); next.delete(confirmation.organization.id); return next; });
      setConfirmation((current) => current === confirmation ? null : current);
    }} onSuccess={(response) => {
      wrote(response.version, nextStatus[confirmation.action]);
      toast.success(t(confirmation.action === "approve" && confirmation.organization.owners.length > 1 ? "platformTenants:messages.approveOwners" : `platformTenants:messages.${confirmation.action}`, { name: confirmation.organization.name, email: maskEmail(confirmation.organization.ownerEmail ?? "") }));
      void invalidate();
    }} /> : null}
  </>;
}
