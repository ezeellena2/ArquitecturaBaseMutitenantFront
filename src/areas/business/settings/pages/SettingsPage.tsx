import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { OrganizationDomainResponse, OrganizationSettingsResponse, UpdateOrganizationSettingsRequest } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
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
  const client = useQueryClient();
  const settings = useQuery({ queryKey: organizationSettingsKey, queryFn: fetchOrganizationSettings, enabled: canRead, meta: { silent: true } });
  const domains = useQuery({ queryKey: organizationDomainsKey, queryFn: fetchOrganizationDomains, enabled: canRead, meta: { silent: true } });
  const [draftState, setDraftState] = useState<SettingsDraft | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [domainDraft, setDomainDraft] = useState("");
  const [domainToRemove, setDomainToRemove] = useState<OrganizationDomainResponse | null>(null);
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
    mutationFn: verifyOrganizationDomain,
    onSuccess: async () => { toast.success(t("settings:domains.verified")); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => toastError(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });
  const removeDomain = useMutation({
    mutationFn: (domain: OrganizationDomainResponse) => removeOrganizationDomain(domain.id, domain.version),
    onSuccess: async () => { setDomainToRemove(null); toast.success(t("settings:domains.removed")); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => toastError(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });

  if (!canRead) return <ForbiddenPage homePath="/org" />;

  const draft = draftState ?? (settings.data ? settingsDraft(settings.data) : null);
  const isDirty = Boolean(settings.data && draft && JSON.stringify(draft) !== JSON.stringify(settingsDraft(settings.data)));
  const error = settings.error ?? domains.error;
  const saveError = failure instanceof ApiError ? failure : undefined;
  const showGeneralError = error ? error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error") : undefined;
  const activeDomains = (domains.data ?? []).filter((domain) => domain.status !== "Removed");

  return <>
    <ConcurrencyBanner error={saveError} isDirty={isDirty} onSeeNew={() => { void settings.refetch().then((result) => { if (result.data) setDraftState(settingsDraft(result.data)); setFailure(undefined); }); }} onContinueEditing={() => setFailure(undefined)} />
    <Page
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
          <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("settings:dataTitle")}</h2></header>
          {settings.isPending ? <p role="status" className="p-4 text-sm text-[var(--t2)]">{t("common:states.loading")}</p> : draft ? <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            <FormField label={t("settings:fields.name")} required><Input value={draft.name} disabled={!canManage} maxLength={120} onChange={(event) => setDraftState({ ...draft, name: event.target.value })} /></FormField>
            <FormField label={t("settings:fields.culture")}><CultureSelect value={draft.defaultCulture} onChange={(defaultCulture) => setDraftState({ ...draft, defaultCulture })} placeholder={t("settings:chooseCulture")} disabled={!canManage} /></FormField>
            <FormField label={t("settings:fields.timeZone")}><TimeZoneSelect value={draft.defaultTimeZoneId} onChange={(defaultTimeZoneId) => setDraftState({ ...draft, defaultTimeZoneId })} placeholder={t("settings:chooseTimeZone")} disabled={!canManage} /></FormField>
            <FormField label={t("settings:fields.currency")}><CurrencySelect value={draft.defaultCurrency} onChange={(defaultCurrency) => setDraftState({ ...draft, defaultCurrency })} placeholder={t("settings:chooseCurrency")} disabled={!canManage} /></FormField>
          </div> : null}
        </Surface>

        <Surface className="overflow-hidden">
          <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
            <h2>{t("settings:domains.title")}</h2>
            {canManage ? <Button type="button" variant="outline" size="sm" onClick={() => setDomainDialogOpen(true)}><Plus aria-hidden="true" className="size-4" />{t("settings:domains.add")}</Button> : null}
          </header>
          {domains.isPending ? <p role="status" className="p-4 text-sm text-[var(--t2)]">{t("common:states.loading")}</p>
            : activeDomains.length === 0 ? <p className="p-4 text-sm text-[var(--t2)]">{t("settings:domains.empty")}</p>
              : <div className="divide-y divide-[var(--borde)]">{activeDomains.map((domain) => <div key={domain.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--t1)]">{domain.domain}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-[var(--t2)]">
                    <span aria-hidden="true" className={`size-2 rounded-full ${domain.status === "Verified" ? "bg-[var(--ok)]" : "bg-[var(--alerta)]"}`} />
                    {t(`settings:domains.status.${domain.status}`)}
                  </p>
                  {domain.status === "Pending" ? <p className="mt-2 break-all text-xs text-[var(--t2)]">{"TXT · "}{domain.txtRecordName}{" · "}{domain.txtRecordValue}</p> : null}
                </div>
                {domain.status === "Pending" && canManage ? <Button type="button" variant="outline" size="sm" disabled={verifyDomain.isPending} onClick={() => verifyDomain.mutate(domain.id)}>{t("settings:domains.verify")}</Button> : null}
                {canManage ? <RowActions label={t("settings:domains.actions", { domain: domain.domain })} actions={[
                  { label: t("settings:domains.remove"), accessibleName: t("settings:domains.remove"), icon: Trash2, destructive: true, onSelect: () => setDomainToRemove(domain) },
                ]} /> : null}
              </div>)}</div>}
        </Surface>
      </div>
    </Page>

    <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
      <DialogContent className="md:max-w-[420px]">
        <DialogHeader><DialogTitle>{t("settings:domains.addTitle")}</DialogTitle><DialogDescription>{t("settings:domains.addDescription")}</DialogDescription></DialogHeader>
        <div className="px-5 py-4"><FormField label={t("settings:domains.domain")} required><Input autoComplete="off" value={domainDraft} onChange={(event) => setDomainDraft(event.target.value)} /></FormField>
          {addDomain.error ? <p role="alert" className="mt-2 text-sm text-[var(--peligro)]">{addDomain.error.detail ?? t("common:states.error")}</p> : null}</div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDomainDialogOpen(false)}>{t("common:actions.cancel")}</Button>
          <Button type="button" disabled={!domainDraft.trim() || addDomain.isPending} onClick={() => addDomain.mutate({ domain: domainDraft.trim() }, { onSuccess: async () => { setDomainDraft(""); setDomainDialogOpen(false); toast.success(t("settings:domains.added")); await client.invalidateQueries({ queryKey: organizationDomainsKey }); } })}>{t("settings:domains.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={domainToRemove !== null}
      onOpenChange={(open) => { if (!open) setDomainToRemove(null); }}
      title={t("settings:domains.removeTitle", { domain: domainToRemove?.domain ?? "" })}
      description={t("settings:domains.removeDescription")}
      confirmLabel={t("settings:domains.remove")}
      destructive
      onConfirm={() => { if (domainToRemove) removeDomain.mutate(domainToRemove); }}
    />
  </>;
}
