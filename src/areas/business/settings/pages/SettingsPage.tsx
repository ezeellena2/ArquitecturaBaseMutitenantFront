import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Trash2 } from "lucide-react";
import { useState } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { defineStatusTones } from "@/shared/format/statusTones";
import { StatusMark } from "@/shared/ui/format/StatusBadge";
import { actionErrorMessage, apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { OrganizationDomainResponse, OrganizationSettingsResponse, UpdateOrganizationSettingsRequest } from "@/shared/api/types";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { CopyIcon, SettingsIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { CultureSelect } from "@/shared/ui/fields/CultureSelect";
import { CurrencySelect } from "@/shared/ui/fields/CurrencySelect";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { RowActions } from "@/shared/ui/RowActions";
import { Section, SectionFields } from "@/shared/ui/Section";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { cn } from "@/shared/lib/utils";
import { List, ListItem } from "@/shared/ui/List";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { CultureText } from "@/shared/ui/format/CultureText";
import { CurrencyText } from "@/shared/ui/format/CurrencyText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import { toastError } from "@/shared/ui/sonner";
import {
  fetchOrganizationDomains, fetchOrganizationSettings, organizationDomainsKey, organizationSettingsKey,
  removeOrganizationDomain, updateOrganizationSettings, verifyOrganizationDomain,
} from "../api/settings";
import { AddDomainDialog } from "../components/AddDomainDialog";
import { activeOrganization } from "@/tenancy/access";

/// Los datos de la organización no tienen reglas propias en la pantalla: lo que el back rechaza de un dato va debajo de
/// ese dato, y lo demás, en la franja.
const settingsFormSchema = z.object({ name: z.string(), defaultCulture: z.string(), defaultTimeZoneId: z.string(), defaultCurrency: z.string() });
type SettingsForm = z.infer<typeof settingsFormSchema>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof SettingsForm> = {
  name: "name", defaultCulture: "defaultCulture", defaultTimeZoneId: "defaultTimeZoneId", defaultCurrency: "defaultCurrency",
};

/// Tablero M-Configuracion (`.w-est`): el dominio verificado en verde y el pendiente en ámbar (tema.md).
const domainStatusTones = defineStatusTones("TenantDomainStatus", { Verified: "success", Pending: "warning", Removed: "neutral" });

function valuesFromSettings(settings: OrganizationSettingsResponse): SettingsForm {
  return { name: settings.name, defaultCulture: settings.defaultCulture, defaultTimeZoneId: settings.defaultTimeZoneId, defaultCurrency: settings.defaultCurrency };
}

export function SettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const settings = useQuery({ queryKey: organizationSettingsKey, queryFn: fetchOrganizationSettings, meta: { silent: true, blocksView: true } });

  // «Criterio · Avisos» (Pantalla de error): la configuración no cargó y no hay nada que mostrar.
  if (settings.isError && !settings.data) return <LoadErrorPage onRetry={() => { void settings.refetch(); }} />;
  if (!settings.data) return <Page icon={SettingsIcon} title={t("settings:title")}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  return <SettingsEditor settings={settings.data} loadError={settings.error} reload={async () => (await settings.refetch()).data} />;
}

/// Configuración (tableros Configuracion y M-Configuracion), como el editor de Roles: los datos con React Hook Form y zod,
/// la versión de `useEditForm`, y el 409, «Cambios sin guardar», la franja y «¿Salir sin guardar?» de `useEditPage`. Los
/// dominios se guardan al momento, desde sus diálogos.
function SettingsEditor({ settings, loadError, reload }: {
  settings: OrganizationSettingsResponse;
  loadError: unknown;
  reload: () => Promise<OrganizationSettingsResponse | undefined>;
}) {
  const { t } = useTranslation(["settings", "common"]);
  const { data: currentUser } = useCurrentUser();
  const { can } = usePermissions();
  const canManage = can("settings.manage");
  const organizationName = activeOrganization(currentUser)?.name ?? "";
  const { phone } = useAppChrome();
  const client = useQueryClient();
  const domains = useQuery({ queryKey: organizationDomainsKey, queryFn: fetchOrganizationDomains, meta: { silent: true } });
  const { form, version, resetTo, wrote } = useEditForm({ read: settings, toValues: valuesFromSettings, resolver: zodResolver(settingsFormSchema) });
  const { errors } = form.formState;
  const culture = useController({ control: form.control, name: "defaultCulture" });
  const timeZone = useController({ control: form.control, name: "defaultTimeZoneId" });
  const currency = useController({ control: form.control, name: "defaultCurrency" });
  const [failure, setFailure] = useState<unknown>();
  const isDirty = canManage && form.formState.isDirty;
  // Tableros Configuracion y Avisos: el 409 en su cartel, «Cambios sin guardar» solo en la banda, el error de guardado en
  // la franja y «¿Salir sin guardar?» antes de irse con cambios.
  const edit = useEditPage({
    isDirty, error: failure,
    onSeeNew: () => { void reload().then((fresh) => { if (fresh) resetTo(fresh); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
  });
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState<OrganizationDomainResponse | null>(null);
  // Tablero Configuracion-Verificar: después de «Siguiente» o de «Verificar», el TXT va en un diálogo, no en la fila.
  const [domainToVerify, setDomainToVerify] = useState<OrganizationDomainResponse | null>(null);
  const [verifyFailure, setVerifyFailure] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const save = useMutation({ mutationFn: (request: UpdateOrganizationSettingsRequest) => updateOrganizationSettings(request) });
  const verifyDomain = useMutation({
    mutationFn: (domain: OrganizationDomainResponse) => verifyOrganizationDomain(domain.id),
    onSuccess: async (_result, domain) => { closeVerify(); toast.success(t("settings:domains.verified", { domain: domain.domain })); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => setVerifyFailure(actionErrorMessage(error, t)),
  });
  const removeDomain = useMutation({
    mutationFn: (domain: OrganizationDomainResponse) => removeOrganizationDomain(domain.id, domain.version),
    onSuccess: async (_result, domain) => { setDomainToRemove(null); toast.success(t("settings:domains.removed", { domain: domain.domain })); await client.invalidateQueries({ queryKey: organizationDomainsKey }); },
    onError: (error) => toastActionError(error, t),
  });

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    setFailure(error);
  }

  // Después de guardar, la ficha queda limpia con lo guardado, aunque la relectura todavía no lo traiga, y la base es la
  // versión que respondió el guardado (`useEditForm`).
  async function saved(values: SettingsForm, sentVersion: number, savedVersion: number) {
    setFailure(undefined);
    form.reset(values);
    toast.success(t("settings:saved"));
    await client.invalidateQueries({ queryKey: organizationSettingsKey });
    wrote(sentVersion, savedVersion, client.getQueryData<OrganizationSettingsResponse>(organizationSettingsKey));
  }

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    save.mutate({ ...values, version }, { onSuccess: (result) => { void saved(values, version, result.version); }, onError: rejected });
  });

  // «Descartar cambios» vuelve a la última lectura de lo guardado, con su versión.
  function discard() {
    resetTo(settings);
    setFailure(undefined);
  }

  async function domainAdded(added: OrganizationDomainResponse) {
    setAddingDomain(false);
    openVerify(added);
    await client.invalidateQueries({ queryKey: organizationDomainsKey });
  }

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

  const error = loadError ?? domains.error;
  const showGeneralError = error ? apiErrorMessage(error, t) : undefined;
  const activeDomains = (domains.data ?? []).filter((domain) => domain.status !== "Removed");

  return <>
    {/* Tablero Configuracion: el título lleva la rueda; los deslizadores son el ícono del menú. */}
    <Page banner={edit.banner}
      icon={SettingsIcon}
      title={t("settings:title")}
      summary={edit.unsaved}
      phoneSubtitle={edit.unsaved}
      actions={canManage ? <>
        <Button type="button" variant="outline" onClick={discard}>{t("settings:discard")}</Button>
        <Button type="submit" form="settings-editor" disabled={!isDirty} pending={save.isPending}>{t("settings:save")}</Button>
      </> : undefined}
    >
      <div className="flex flex-col gap-4 max-md:gap-3.5">
        {showGeneralError ? <FormError message={showGeneralError} /> : null}
        {edit.formError}
        {/* Tablero M-Configuracion: en el teléfono los datos van sueltos sobre blanco, sin título a la vista. */}
        <Section title={t("settings:dataTitle")} phone="untitled">
          <form id="settings-editor" noValidate aria-label={t("settings:title")} onSubmit={(event) => { void submit(event); }}>
            <SectionFields className="grid gap-4 md:grid-cols-2 max-md:gap-3.5">
              {/* Tablero «Criterio · Formularios»: sin permiso para cambiar, los datos se leen como texto, sin campos grises. */}
              {canManage ? <>
                <FormField label={t("settings:fields.name")} required error={errors.name?.message}><Input {...form.register("name")} maxLength={120} /></FormField>
                <FormField label={t("settings:fields.culture")} error={errors.defaultCulture?.message}><CultureSelect value={culture.field.value} onChange={culture.field.onChange} placeholder={t("settings:chooseCulture")} /></FormField>
                <FormField label={t("settings:fields.timeZone")} error={errors.defaultTimeZoneId?.message}><TimeZoneSelect value={timeZone.field.value} onChange={timeZone.field.onChange} placeholder={t("settings:chooseTimeZone")} /></FormField>
                <FormField label={t("settings:fields.currency")} error={errors.defaultCurrency?.message}><CurrencySelect value={currency.field.value} onChange={currency.field.onChange} placeholder={t("settings:chooseCurrency")} /></FormField>
              </> : <>
                <ReadOnlyField label={t("settings:fields.name")}>{settings.name}</ReadOnlyField>
                <ReadOnlyField label={t("settings:fields.culture")}><CultureText value={settings.defaultCulture} /></ReadOnlyField>
                <ReadOnlyField label={t("settings:fields.timeZone")}><TimeZoneText value={settings.defaultTimeZoneId} /></ReadOnlyField>
                <ReadOnlyField label={t("settings:fields.currency")}><CurrencyText value={settings.defaultCurrency} /></ReadOnlyField>
              </>}
            </SectionFields>
          </form>
        </Section>

        <Section title={t("settings:domains.title")} phone="inset" action={canManage ? { label: t("settings:domains.add"), onClick: () => setAddingDomain(true) } : undefined}>
          {domains.isPending ? <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
            // Tableros Configuracion (.o-dom-vacio) y M-Configuracion-Dominio (.ap-it.apag): en el teléfono, una fila apagada.
            : activeDomains.length === 0 ? <p className="px-4 py-3.5 text-[13px] text-[var(--t3)] max-md:flex max-md:min-h-14 max-md:items-center max-md:py-2 max-md:pr-3.5 max-md:pl-4 max-md:text-[15.5px] max-md:font-medium max-md:text-[var(--t1)] max-md:opacity-55">{t("settings:domains.empty")}</p>
              : <List label={t("settings:domains.title")}>{activeDomains.map((domain) => <ListItem key={domain.id} icon={<Globe aria-hidden="true" />} title={domain.domain}
                detail={<span className="inline-flex items-center gap-1.5 max-md:block max-md:whitespace-normal">
                  {/* Tablero M-Configuracion: en el teléfono el estado lleva su punto, y la línea sigue abajo en lugar de cortarse. */}
                  <StatusMark tones={domainStatusTones} value={domain.status} className="hidden max-md:mr-1.5 max-md:inline-block max-md:align-middle" />
                  {/* Tableros Configuracion y M-Configuracion: el verificado dice cuántos correos administra la organización
                      («Verificado · 10 correos administrados por Grupo Delta», con managedEmailCount del back). */}
                  <span><span>{t(`settings:domains.status.${domain.status}`)}</span>{domain.status === "Verified" && domain.managedEmailCount > 0
                    ? ` · ${t("settings:domains.managedEmails", { count: domain.managedEmailCount, organization: organizationName })}` : null}</span>
                </span>}>
                {domain.status === "Pending" && canManage && domain.txtRecordValue ? <Button type="button" variant="outline" size="sm" onClick={() => openVerify(domain)}>{t("settings:domains.verify")}</Button> : null}
                {canManage ? <RowActions label={t("settings:domains.actions", { domain: domain.domain })} title={domain.domain} actions={[
                  { label: t("settings:domains.remove"), accessibleName: t("settings:domains.remove"), icon: Trash2, destructive: true, onSelect: () => setDomainToRemove(domain) },
                ]} /> : null}
              </ListItem>)}</List>}
        </Section>
      </div>
    </Page>

    {addingDomain ? <AddDomainDialog onClose={() => setAddingDomain(false)} onAdded={(added) => { void domainAdded(added); }} /> : null}

    <Dialog open={domainToVerify !== null} onOpenChange={(open) => { if (!open && !verifyDomain.isPending) closeVerify(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("settings:domains.verifyTitle", { domain: domainToVerify?.domain ?? "" })}</DialogTitle></DialogHeader>
        {/* Tablero Configuracion-Verificar: lo que hay que hacer, con la letra de los diálogos, y el registro TXT. */}
        <DialogBody>
          <DialogDescription>{t("settings:domains.verifyDescription")}</DialogDescription>
          {/* Tablero M-Configuracion-Verificar: en el teléfono, el rótulo como el de los campos (13,5 y gris), el registro en
              la caja gris de 48 sin borde y «Copiar» en texto petróleo con su ícono, como las acciones en texto (.ap-txt).
              Configuracion-Verificar (.rt y .o-codigo): el rótulo en 12,5 y gris medio, el registro en 13 en una caja de
              radio 8 con 10 y 12 de relleno. Los dos, con la altura normal de su letra. */}
          <div className="flex flex-col gap-1.5">
            <span className={phone ? "text-[13.5px] leading-[normal] font-semibold text-[var(--t2)]" : "text-[12.5px] font-semibold text-[var(--t2)]"}>{t("settings:domains.txtLabel", { domain: domainToVerify?.domain ?? "" })}</span>
            <div className={phone ? "flex min-h-12 items-center gap-2 rounded-[12px] bg-[var(--s3)] pl-3.5 pr-1.5" : "flex items-center gap-3 rounded-[8px] border border-[var(--borde)] bg-[var(--s2)] px-3 py-2.5"}>
              <code className={cn("min-w-0 flex-1 break-all font-mono text-[var(--t1)]", phone ? "text-[14px] leading-[normal]" : "text-[13px] leading-[normal]")}>{domainToVerify?.txtRecordValue}</code>
              {phone
                ? <button type="button" onClick={() => { if (domainToVerify?.txtRecordValue) copyTxt(domainToVerify.txtRecordValue); }}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 px-2.5 text-[15.5px] font-semibold text-[var(--marca-tx)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
                  <CopyIcon className="size-4" />{copied ? t("settings:domains.copied") : t("settings:domains.copy")}
                </button>
                : <Button type="button" variant="outline" size="sm" onClick={() => { if (domainToVerify?.txtRecordValue) copyTxt(domainToVerify.txtRecordValue); }}>{copied ? t("settings:domains.copied") : t("settings:domains.copy")}</Button>}
            </div>
          </div>
          {verifyFailure ? <FormError message={verifyFailure} /> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={verifyDomain.isPending} onClick={closeVerify}>{t("common:actions.cancel")}</Button>
          <Button type="button" pending={verifyDomain.isPending} pendingLabel={t("settings:domains.checking")} onClick={() => { if (domainToVerify) { setVerifyFailure(null); verifyDomain.mutate(domainToVerify); } }}>{t("settings:domains.check")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={domainToRemove !== null}
      onOpenChange={(open) => { if (!open) setDomainToRemove(null); }}
      title={t("settings:domains.removeTitle", { domain: domainToRemove?.domain ?? "" })}
      // Tableros Configuracion-Quitar y M-Configuracion-Quitar (v108): con correos administrados, qué pasa con ellos («Los
      // 10 que ya lo están siguen igual.», «El que ya lo está sigue igual.»); sin ninguno, solo lo de los correos nuevos.
      description={[t("settings:domains.removeDescription", { domain: domainToRemove?.domain ?? "", organization: organizationName }),
        ...(domainToRemove && domainToRemove.managedEmailCount > 0 ? [t("settings:domains.removeKept", { count: domainToRemove.managedEmailCount })] : [])].join(" ")}
      confirmLabel={t("settings:domains.remove")}
      destructive
      onConfirm={() => { if (domainToRemove) removeDomain.mutate(domainToRemove); }}
    />
    {edit.leaveDialog}
  </>;
}
