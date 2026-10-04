import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationDomainResponse, OrganizationSettingsResponse, UpdateOrganizationSettingsRequest } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { CultureSelect } from "@/shared/ui/fields/CultureSelect";
import { CurrencySelect } from "@/shared/ui/fields/CurrencySelect";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { List, ListItem } from "@/shared/ui/List";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { CultureText } from "@/shared/ui/format/CultureText";
import { CurrencyText } from "@/shared/ui/format/CurrencyText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import {
  fetchOrganizationDomains, fetchOrganizationSettings, organizationDomainsKey, organizationSettingsKey,
  registerOrganizationDomain, removeOrganizationDomain, updateOrganizationSettings, verifyOrganizationDomain,
} from "../api/settings";

type SettingsDraft = Pick<OrganizationSettingsResponse, "name" | "defaultCulture" | "defaultTimeZoneId" | "defaultCurrency">;

function settingsDraft(settings: OrganizationSettingsResponse): SettingsDraft {
  return { name: settings.name, defaultCulture: settings.defaultCulture, defaultTimeZoneId: settings.defaultTimeZoneId, defaultCurrency: settings.defaultCurrency };
}

export function SettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const { data: currentUser } = useCurrentUser();
  const canRead = currentUser?.permissions?.includes("settings.read") === true;
  const canManage = currentUser?.permissions?.includes("settings.manage") === true;
  const organizationName = currentUser?.organizations.find((organization) => organization.id === currentUser.activeTenantId)?.name ?? "";
  const client = useQueryClient();
  const settings = useQuery({ queryKey: organizationSettingsKey, queryFn: fetchOrganizationSettings, enabled: canRead, meta: { silent: true } });
  const domains = useQuery({ queryKey: organizationDomainsKey, queryFn: fetchOrganizationDomains, enabled: canRead, meta: { silent: true } });
  const [draftState, setDraftState] = useState<SettingsDraft | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [domainDraft, setDomainDraft] = useState("");
  const [domainToRemove, setDomainToRemove] = useState<OrganizationDomainResponse | null>(null);
  // Tablero Configuracion-Verificar: después de «Siguiente» o de «Verificar», el TXT va en un diálogo, no en la fila.
  const [domainToVerify, setDomainToVerify] = useState<OrganizationDomainResponse | null>(null);
  const [verifyFailure, setVerifyFailure] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const save = useMutation({
    mutationFn: (request: UpdateOrganizationSettingsRequest) => updateOrganizationSettings(request),
    onSuccess: async () => {
      setFailure(undefined);
      toast.success(t("settings:saved"));
      await client.invalidateQueries({ queryKey: organizationSettingsKey });
    },
    onError: (error) => setFailure(error),
  });
  const addDomain = useIdempotentMutation((domain: { domain: string }, key) => registerOrganizationDomain(domain, key));
  const verifyDomain = useMutation({
    mutationFn: (domain: OrganizationDomainResponse) => verifyOrganizationDomain(domain.id),
    onSuccess: async (_result, domain) => { closeVerify(); toast.success(t("settings:domains.verified", { domain: domain.domain })); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => setVerifyFailure(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });
  const removeDomain = useMutation({
    mutationFn: (domain: OrganizationDomainResponse) => removeOrganizationDomain(domain.id, domain.version),
    onSuccess: async (_result, domain) => { setDomainToRemove(null); toast.success(t("settings:domains.removed", { domain: domain.domain })); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => toastError(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  function openVerify(domain: OrganizationDomainResponse) {
    setDomainToVerify(domain);
    setVerifyFailure(null);
    setCopied(false);
  }

  function closeVerify() {
    setDomainToVerify(null);
    setVerifyFailure(null);
    setCopied(false);
  }

  function copyTxt(value: string) {
    void navigator.clipboard.writeText(value).then(() => setCopied(true)).catch(() => toastError(t("common:states.error")));
  }

  const draft = draftState ?? (settings.data ? settingsDraft(settings.data) : null);
  const isDirty = Boolean(settings.data && draft && JSON.stringify(draft) !== JSON.stringify(settingsDraft(settings.data)));
  const error = settings.error ?? domains.error;
  const saveError = failure instanceof ApiError ? failure : undefined;
  const showGeneralError = error ? error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error") : undefined;
  const activeDomains = (domains.data ?? []).filter((domain) => domain.status !== "Removed");

  return <>
    <Page banner={<ConcurrencyBanner error={saveError} isDirty={isDirty} onSeeNew={() => { void settings.refetch().then((result) => { if (result.data) setDraftState(settingsDraft(result.data)); setFailure(undefined); }); }} onContinueEditing={() => setFailure(undefined)} />}
      icon={SlidersHorizontal}
      title={t("settings:title")}
      actions={canManage && draft && settings.data ? <>
        <Button type="button" variant="outline" onClick={() => setDraftState(settingsDraft(settings.data!))}>{t("settings:discard")}</Button>
        <Button type="button" disabled={!isDirty || save.isPending} onClick={() => save.mutate({ ...draft, version: settings.data!.version })}>{t("settings:save")}</Button>
      </> : undefined}
    >
      <div className="flex flex-col gap-4">
        {showGeneralError ? <FormError message={showGeneralError} /> : null}
        {failure && !(failure instanceof ApiError && failure.code === "General.ConcurrencyConflict") ? <FormError message={saveError?.detail ?? t("common:states.error")} /> : null}
        <Surface className="overflow-hidden">
          <section aria-labelledby="settings-data-title">
          <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2 id="settings-data-title">{t("settings:dataTitle")}</h2></header>
          {settings.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p> : draft ? <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            {/* Tablero «Criterio · Formularios»: sin permiso para cambiar, los datos se leen como texto, sin campos grises. */}
            {canManage ? <>
              <FormField label={t("settings:fields.name")} required><Input value={draft.name} maxLength={120} onChange={(event) => setDraftState({ ...draft, name: event.target.value })} /></FormField>
              <FormField label={t("settings:fields.culture")}><CultureSelect value={draft.defaultCulture} onChange={(defaultCulture) => setDraftState({ ...draft, defaultCulture })} placeholder={t("settings:chooseCulture")} /></FormField>
              <FormField label={t("settings:fields.timeZone")}><TimeZoneSelect value={draft.defaultTimeZoneId} onChange={(defaultTimeZoneId) => setDraftState({ ...draft, defaultTimeZoneId })} placeholder={t("settings:chooseTimeZone")} /></FormField>
              <FormField label={t("settings:fields.currency")}><CurrencySelect value={draft.defaultCurrency} onChange={(defaultCurrency) => setDraftState({ ...draft, defaultCurrency })} placeholder={t("settings:chooseCurrency")} /></FormField>
            </> : <>
              <ReadOnlyField label={t("settings:fields.name")}>{draft.name}</ReadOnlyField>
              <ReadOnlyField label={t("settings:fields.culture")}><CultureText value={draft.defaultCulture} /></ReadOnlyField>
              <ReadOnlyField label={t("settings:fields.timeZone")}><TimeZoneText value={draft.defaultTimeZoneId} /></ReadOnlyField>
              <ReadOnlyField label={t("settings:fields.currency")}><CurrencyText value={draft.defaultCurrency} /></ReadOnlyField>
            </>}
          </div> : null}
          </section>
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
            <h2>{t("settings:domains.title")}</h2>
            {canManage ? <Button type="button" variant="outline" size="sm" onClick={() => setDomainDialogOpen(true)}><Plus aria-hidden="true" className="size-4" />{t("settings:domains.add")}</Button> : null}
          </header>
          {domains.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
            : activeDomains.length === 0 ? <p className="p-4 text-[13px] text-[var(--t2)]">{t("settings:domains.empty")}</p>
              : <List label={t("settings:domains.title")}>{activeDomains.map((domain) => <ListItem key={domain.id} icon={<Globe aria-hidden="true" />} title={domain.domain}
                detail={t(`settings:domains.status.${domain.status}`)}>
                {domain.status === "Pending" && canManage && domain.txtRecordValue ? <Button type="button" variant="outline" size="sm" onClick={() => openVerify(domain)}>{t("settings:domains.verify")}</Button> : null}
                {canManage ? <RowActions label={t("settings:domains.actions", { domain: domain.domain })} actions={[
                  { label: t("settings:domains.remove"), accessibleName: t("settings:domains.remove"), icon: Trash2, destructive: true, onSelect: () => setDomainToRemove(domain) },
                ]} /> : null}
              </ListItem>)}</List>}
        </Surface>
      </div>
    </Page>

    <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
      <DialogContent className="md:max-w-[420px]">
        <DialogHeader><DialogTitle>{t("settings:domains.addTitle")}</DialogTitle></DialogHeader>
        <div className="px-5 py-4"><FormField label={t("settings:domains.domain")} required><Input autoComplete="off" value={domainDraft} onChange={(event) => setDomainDraft(event.target.value)} /></FormField>
          {addDomain.error ? <p role="alert" className="mt-2 text-[13px] text-[var(--peligro)]">{addDomain.error.detail ?? t("common:states.error")}</p> : null}</div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDomainDialogOpen(false)}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={!domainDraft.trim() || addDomain.isPending} onClick={() => addDomain.mutate({ domain: domainDraft.trim() }, { onSuccess: async (domain) => { setDomainDraft(""); setDomainDialogOpen(false); openVerify(domain); await client.invalidateQueries({ queryKey: organizationDomainsKey }); } })}>{t("settings:domains.next")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={domainToVerify !== null} onOpenChange={(open) => { if (!open && !verifyDomain.isPending) closeVerify(); }}>
      <DialogContent className="md:max-w-[560px]">
        <DialogHeader><DialogTitle>{t("settings:domains.verifyTitle", { domain: domainToVerify?.domain ?? "" })}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 px-5 py-4 text-[13px]">
          <p className="text-[var(--t1)]">{t("settings:domains.verifyDescription")}</p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--t1)] lg:text-[13px]">{t("settings:domains.txtLabel", { domain: domainToVerify?.domain ?? "" })}</span>
            <div className="flex items-center gap-3 rounded-[10px] border border-[var(--borde)] bg-[var(--s2)] py-2 pl-3 pr-2">
              <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-[var(--t1)]">{domainToVerify?.txtRecordValue}</code>
              <Button type="button" variant="outline" size="sm" onClick={() => { if (domainToVerify?.txtRecordValue) copyTxt(domainToVerify.txtRecordValue); }}>{copied ? t("settings:domains.copied") : t("settings:domains.copy")}</Button>
            </div>
          </div>
          {verifyFailure ? <FormError message={verifyFailure} /> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={verifyDomain.isPending} onClick={closeVerify}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={verifyDomain.isPending} onClick={() => { if (domainToVerify) { setVerifyFailure(null); verifyDomain.mutate(domainToVerify); } }}>{t("settings:domains.check")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={domainToRemove !== null}
      onOpenChange={(open) => { if (!open) setDomainToRemove(null); }}
      title={t("settings:domains.removeTitle", { domain: domainToRemove?.domain ?? "" })}
      description={t("settings:domains.removeDescription", { domain: domainToRemove?.domain ?? "", organization: organizationName })}
      confirmLabel={t("settings:domains.remove")}
      destructive
      onConfirm={() => { if (domainToRemove) removeDomain.mutate(domainToRemove); }}
    />
  </>;
}
