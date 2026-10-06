import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type Mutation, type MutationOptions } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { MeResponse, PlatformSettingsResponse, VersionResponse } from "@/shared/api/types";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { ReasonDialog, type ReasonDialogValues } from "@/shared/platform/ReasonDialog";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { NumberField } from "@/shared/ui/fields/NumberField";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { SlidersHorizontalIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { fetchPlatformSettings, platformSettingsKey, updatePlatformSettings } from "../api/platformSettings";

function settingsFormSchema(t: TFunction) {
  // Validación exacta del tablero Config-Plat; NumberField y EmailField normalizan la entrada.
  const email = z.string().nullable().refine((value) => value !== null && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), t("platformSettings:validation.email"));
  return z.object({ consumerSignup: z.enum(["Open", "Closed"]), businessSignup: z.enum(["Open", "RequiresApproval", "Closed"]),
    maxOwnedOrganizations: z.number().nullable().refine((value) => value !== null && Number.isInteger(value) && value >= 1 && value <= 50, t("platformSettings:validation.range")), salesEmail: email, supportEmail: email });
}
type SettingsForm = z.infer<ReturnType<typeof settingsFormSchema>>;
type SettingsConfirmation = { values: SettingsForm; version: number; draft: number; read: PlatformSettingsResponse };
const serverFields: Record<string, keyof SettingsForm> = { consumerSignup: "consumerSignup", businessSignup: "businessSignup", maxOwnedOrganizations: "maxOwnedOrganizations", salesEmail: "salesEmail", supportEmail: "supportEmail" };
function valuesFromSettings(settings: PlatformSettingsResponse): SettingsForm {
  return { consumerSignup: settings.consumerSignup, businessSignup: settings.businessSignup, maxOwnedOrganizations: settings.maxOwnedOrganizations,
    salesEmail: settings.salesEmail ?? null, supportEmail: settings.supportEmail ?? null };
}
function sameValues(left: SettingsForm, right: SettingsForm) {
  return left.consumerSignup === right.consumerSignup && left.businessSignup === right.businessSignup && left.maxOwnedOrganizations === right.maxOwnedOrganizations && left.salesEmail === right.salesEmail && left.supportEmail === right.supportEmail;
}
function sameRead(left: PlatformSettingsResponse, right: PlatformSettingsResponse) {
  return left.version === right.version && sameValues(valuesFromSettings(left), valuesFromSettings(right));
}

export function PlatformSettingsPage() {
  const { t } = useTranslation(["platformSettings", "common"]);
  const settings = useQuery({ queryKey: platformSettingsKey, queryFn: fetchPlatformSettings, meta: { silent: true, blocksView: true } });
  if (settings.isError && !settings.data) return <LoadErrorPage onRetry={() => { void settings.refetch(); }} />;
  if (!settings.data) return <Page icon={SlidersHorizontalIcon} title={t("platformSettings:title")}><p role="status">{t("common:states.loading")}</p></Page>;
  return <SettingsEditor settings={settings.data} loadError={settings.error} reload={async () => { const result = await settings.refetch(); return result.isSuccess ? result.data : undefined; }} />;
}

function SettingsEditor({ settings, loadError, reload }: { settings: PlatformSettingsResponse; loadError: unknown; reload: () => Promise<PlatformSettingsResponse | undefined> }) {
  const { t } = useTranslation(["platformSettings", "common"]); const client = useQueryClient(); const { phone } = useAppChrome(); const { canPlatform } = usePermissions();
  const canManage = canPlatform("platform.settings.manage");
  const schema = useMemo(() => settingsFormSchema(t), [t]);
  const { form, version, resetTo, wrote } = useEditForm({ read: settings, toValues: valuesFromSettings, resolver: zodResolver(schema) });
  const consumer = useController({ control: form.control, name: "consumerSignup" }); const business = useController({ control: form.control, name: "businessSignup" });
  const count = useController({ control: form.control, name: "maxOwnedOrganizations" }); const sales = useController({ control: form.control, name: "salesEmail" }); const support = useController({ control: form.control, name: "supportEmail" });
  const [failure, setFailure] = useState<unknown>(); const [confirmation, setConfirmation] = useState<SettingsConfirmation | null>(null); const [busy, setBusy] = useState(false);
  const active = useRef(true); const draft = useRef(0); const choice = useRef<SettingsConfirmation | null>(null);
  const ownRead = useRef<{ previous: PlatformSettingsResponse; saved: PlatformSettingsResponse } | null>(null);
  const router = useContext(UNSAFE_DataRouterContext)?.router; const routerState = useContext(UNSAFE_DataRouterStateContext); const navigation = useRef(router);
  const navigationBlocked = [...(routerState?.blockers.values() ?? [])].some((blocker) => blocker.state === "blocked");
  const blocked = useCallback(() => [...(navigation.current?.state.blockers.values() ?? [])].some((blocker) => blocker.state === "blocked"), []);
  const eligible = useCallback(() => active.current && !blocked() && navigation.current?.state.location.pathname === "/plataforma/configuracion"
    && (client.getQueryData<MeResponse>(currentUserQueryKey)?.effectivePermissions.platform.includes("platform.settings.manage") ?? false), [blocked, client]);
  const abandon = useCallback(() => { draft.current++; choice.current = null; setConfirmation(null); setBusy(false); }, []);
  useEffect(() => { active.current = true; return () => { active.current = false; choice.current = null; }; }, []);
  useEffect(() => {
    let wasBlocked = false;
    return router?.subscribe((state) => {
      const isBlocked = [...state.blockers.values()].some((blocker) => blocker.state === "blocked");
      if (isBlocked && !wasBlocked) abandon();
      wasBlocked = isBlocked;
    });
  }, [router, abandon]);
  const current = (sent: SettingsConfirmation) => eligible() && choice.current === sent && draft.current === sent.draft && sameValues(sent.values, form.getValues());
  const seeNew = async () => {
    if (!eligible()) return;
    abandon(); const readingDraft = draft.current;
    const fresh = await reload();
    if (!eligible() || readingDraft !== draft.current || !fresh) return;
    ownRead.current = null; resetTo(fresh); setFailure(undefined);
  };
  const isDirty = canManage && form.formState.isDirty;
  const edit = useEditPage({ isDirty, error: failure, onSeeNew: () => { void seeNew(); }, onContinueEditing: () => { abandon(); setFailure(undefined); } });

  function changed(field: keyof SettingsForm) { abandon(); form.clearErrors(field); setFailure(undefined); }
  function discard() {
    abandon(); const own = ownRead.current;
    // La versión es un token opaco: sólo la misma instantánea previa requiere la respuesta propia.
    if (own && sameRead(settings, own.previous)) resetTo(own.saved);
    else { ownRead.current = null; resetTo(settings); }
    setFailure(undefined);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    const submittedDraft = draft.current;
    return form.handleSubmit((values) => {
      if (!eligible() || draft.current !== submittedDraft || busy) return;
      abandon(); setFailure(undefined);
      const next = { values, version, draft: draft.current, read: { ...settings } }; choice.current = next; setConfirmation(next);
    })(event);
  }
  async function execute(sent: SettingsConfirmation, reason: ReasonDialogValues, reasonCurrent: () => boolean): Promise<VersionResponse> {
    const valid = () => current(sent) && reasonCurrent();
    if (!valid() || sent.values.maxOwnedOrganizations === null) throw new DOMException("", "AbortError");
    setBusy(true);
    try {
      const response = await updatePlatformSettings({ ...sent.values, version: sent.version, reason: reason.reason });
      if (!valid()) throw new DOMException("", "AbortError");
      // La escritura propia cambia la base antes de cualquier invalidación/GET; una lectura vieja nunca la reemplaza.
      wrote(sent.version, response.version, undefined); form.reset(sent.values);
      ownRead.current = { previous: sent.read, saved: { ...sent.values, maxOwnedOrganizations: sent.values.maxOwnedOrganizations, version: response.version } };
      setFailure(undefined); toast.success(t("platformSettings:saved")); abandon();
      void client.invalidateQueries({ queryKey: platformSettingsKey });
      return response;
    } catch (error) {
      if (!valid()) throw new DOMException("", "AbortError");
      setBusy(false);
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") { abandon(); setFailure(error); }
      else if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) abandon();
      throw error;
    }
  }
  const errors = form.formState.errors;
  return <>
    <Page icon={SlidersHorizontalIcon} title={t("platformSettings:title")} summary={edit.unsaved} phoneSubtitle={t("platformSettings:administration")}
      backTo={phone ? { to: "/plataforma/mas", label: t("platformSettings:back") } : undefined} banner={edit.banner}
      actions={<><Button type="button" variant="outline" onClick={discard}>{t("platformSettings:discard")}</Button><Button type="submit" form="platform-settings-editor" disabled={!isDirty} pending={busy} pendingLabel={t("platformSettings:saving")}>{t("platformSettings:save")}</Button></>}>
      {loadError ? <FormError message={apiErrorMessage(loadError, t)} /> : null}{edit.formError}
      <form id="platform-settings-editor" noValidate aria-label={t("platformSettings:title")} onSubmit={(event) => { void submit(event); }} className="flex flex-col gap-3.5">
        <Section title={t("platformSettings:signupTitle")} phone="inset"><SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
          <FormField label={t("platformSettings:fields.consumerSignup")} error={errors.consumerSignup?.message}>
            <Select value={consumer.field.value} onValueChange={(value) => { changed("consumerSignup"); consumer.field.onChange(value); }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="Open" description={t("platformSettings:consumer.Open.description")}>{t("platformSettings:consumer.Open.label")}</SelectItem>
              <SelectItem value="Closed" description={t("platformSettings:consumer.Closed.description")}>{t("platformSettings:consumer.Closed.label")}</SelectItem>
            </SelectContent></Select>
          </FormField>
          <FormField label={t("platformSettings:fields.businessSignup")} error={errors.businessSignup?.message}>
            <Select value={business.field.value} onValueChange={(value) => { changed("businessSignup"); business.field.onChange(value); }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="Open" description={t("platformSettings:business.Open.description")}>{t("platformSettings:business.Open.label")}</SelectItem>
              <SelectItem value="RequiresApproval" description={t("platformSettings:business.RequiresApproval.description")}>{t("platformSettings:business.RequiresApproval.label")}</SelectItem>
              <SelectItem value="Closed" description={t("platformSettings:business.Closed.description")}>{t("platformSettings:business.Closed.label")}</SelectItem>
            </SelectContent></Select>
          </FormField>
          <FormField label={t("platformSettings:fields.maxOwnedOrganizations")} error={errors.maxOwnedOrganizations?.message}>
            <NumberField name={count.field.name} value={count.field.value} onChange={(value) => { changed("maxOwnedOrganizations"); count.field.onChange(value); }} />
          </FormField>
        </SectionFields></Section>
        <Section title={t("platformSettings:contactTitle")} phone="inset"><SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
          <FormField label={t("platformSettings:fields.salesEmail")} error={errors.salesEmail?.message}>
            <EmailField name={sales.field.name} value={sales.field.value} onChange={(value) => { changed("salesEmail"); sales.field.onChange(value); }} />
          </FormField>
          <FormField label={t("platformSettings:fields.supportEmail")} error={errors.supportEmail?.message}>
            <EmailField name={support.field.name} value={support.field.value} onChange={(value) => { changed("supportEmail"); support.field.onChange(value); }} />
          </FormField>
        </SectionFields></Section>
      </form>
    </Page>
    {confirmation && !navigationBlocked ? <SettingsReasonConfirmation confirmation={confirmation} current={() => current(confirmation)}
      onClose={() => { if (choice.current === confirmation) abandon(); }} execute={(reason, reasonCurrent) => execute(confirmation, reason, reasonCurrent)} /> : null}
    {edit.leaveDialog}
  </>;
}

interface NativeCallbacks {
  valid: () => boolean;
  original: MutationOptions<unknown, Error, unknown, unknown>;
  guarded: MutationOptions<unknown, Error, unknown, unknown>;
}

// ReasonDialog conserva RHF y foco. Guardamos también sus callbacks nativos: un Retry abandonado sigue siendo
// AbortError en MutationCache, pero no agrega una franja ni cierra la confirmación actual.
function SettingsReasonConfirmation({ confirmation, current, onClose, execute }: { confirmation: SettingsConfirmation; current: () => boolean; onClose: () => void;
  execute: (reason: ReasonDialogValues, reasonCurrent: () => boolean) => Promise<VersionResponse> }) {
  const { t } = useTranslation(["platformSettings", "common"]); const client = useQueryClient();
  const active = useRef(true); const revision = useRef(0); const [reasonRevision, setReasonRevision] = useState(0);
  const reasonValue = useRef(""); const submittedRevision = useRef<number | null>(null);
  const bindings = useRef(new WeakMap<Mutation, NativeCallbacks>());
  const protect = useCallback((mutation: Mutation) => {
    const binding = bindings.current.get(mutation);
    if (!binding) return;
    const options = mutation.options;
    if (options.onSuccess === binding.guarded.onSuccess && options.onError === binding.guarded.onError && options.onSettled === binding.guarded.onSettled) return;
    binding.original = { ...options,
      onSuccess: options.onSuccess === binding.guarded.onSuccess ? binding.original.onSuccess : options.onSuccess,
      onError: options.onError === binding.guarded.onError ? binding.original.onError : options.onError,
      onSettled: options.onSettled === binding.guarded.onSettled ? binding.original.onSettled : options.onSettled,
    };
    mutation.setOptions({ ...options, onSuccess: binding.guarded.onSuccess, onError: binding.guarded.onError, onSettled: binding.guarded.onSettled });
  }, []);
  function bind(values: ReasonDialogValues, valid: () => boolean) {
    // Las variables son la identidad pública de esta ejecución de ReasonDialog; no se toca ninguna mutación ajena.
    const mutation = client.getMutationCache().find({ predicate: (candidate) => candidate.state.variables === values });
    if (!mutation) return undefined;
    let binding = bindings.current.get(mutation);
    if (!binding) {
      const original = mutation.options;
      const next: NativeCallbacks = { valid, original, guarded: {} };
      next.guarded = {
        onSuccess: (...args) => next.valid() ? next.original.onSuccess?.(...args) : undefined,
        onError: (...args) => next.valid() ? next.original.onError?.(...args) : undefined,
        onSettled: (...args) => next.valid() ? next.original.onSettled?.(...args) : undefined,
      };
      bindings.current.set(mutation, next); binding = next;
    }
    binding.valid = valid; protect(mutation); return mutation;
  }
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => client.getMutationCache().subscribe((event) => {
    // Observer.setOptions avisa antes de actualizar la mutación pendiente. Se protege después, sin alterar el observer.
    if (event.type === "observerOptionsUpdated" && event.mutation) {
      const mutation = event.mutation;
      queueMicrotask(() => protect(mutation));
    }
  }), [client, protect]);
  return <div onSubmitCapture={() => { submittedRevision.current = revision.current; }} onChangeCapture={(event) => {
    if (event.target instanceof HTMLTextAreaElement && event.target.name === "reason") { reasonValue.current = event.target.value.trim(); revision.current++; setReasonRevision(revision.current); }
  }}>
    <ReasonDialog title={t("platformSettings:confirmTitle")} description={t("platformSettings:confirmDescription")} confirmLabel={t("platformSettings:confirm")} pendingLabel={t("platformSettings:saving")}
      queryRoot={platformSettingsKey} onClose={onClose} mutationFn={async (values) => {
        const sentRevision = submittedRevision.current;
        const valid = () => active.current && current() && reasonRevision === revision.current && sentRevision === revision.current && values.reason === reasonValue.current;
        const mutation = bind(values, valid);
        try { const response = await execute(values, valid); if (mutation) protect(mutation); return response; }
        catch (error) { if (mutation) protect(mutation); throw error; }
      }} onSuccess={() => {}}
      key={confirmation.draft} />
  </div>;
}
