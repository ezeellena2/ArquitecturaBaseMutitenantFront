import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { LegalDocumentKind, PlatformLegalDocumentGroupResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { enabledOptions, type CultureReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DateField } from "@/shared/ui/fields/DateField";
import { FormField } from "@/shared/ui/FormField";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { fetchLegalDocuments, legalDocumentsQueryKey, publishLegalDocument } from "../api/legalDocuments";
import { LegalPublicationOwner } from "../components/LegalPublicationOwner";
import { legalErrorField } from "../errors";
import { samePublication, type LegalPublicationOperation } from "../lib/legalPublication";
import { nextVersion } from "../lib/legalVersions";

// TextLimits.LegalDocument del productor real; el schema OpenAPI aún no publica el maxLength de ChildRules.
const legalDocumentMaxLength = 100_000;
function contentLabel(culture: CultureReference, t: TFunction) {
  return culture.languageCode === "es" ? t("platformLegal:fields.es") : culture.languageCode === "en" ? t("platformLegal:fields.en") : t("platformLegal:fields.other", { culture: culture.name });
}
function contentRequired(culture: CultureReference | undefined, t: TFunction) {
  return culture?.languageCode === "es" ? t("platformLegal:validation.esRequired") : culture?.languageCode === "en" ? t("platformLegal:validation.enRequired") : t("platformLegal:validation.contentRequired", { culture: culture?.name ?? "" });
}
function legalFormSchema(cultures: readonly CultureReference[], t: TFunction) {
  return z.object({ kind: z.enum(["Terms", "Privacy"]), effectiveOn: z.string().nullable(), dateValid: z.boolean(),
    contents: z.array(z.object({ culture: z.string(), text: z.string().max(legalDocumentMaxLength, t("platformLegal:validation.contentTooLong")) })),
  }).superRefine((values, context) => {
    if (!values.dateValid || !values.effectiveOn) context.addIssue({ code: "custom", path: ["effectiveOn"], message: t(values.dateValid ? "platformLegal:validation.dateRequired" : "platformLegal:validation.dateInvalid") });
    values.contents.forEach((content, index) => { if (!content.text.trim()) context.addIssue({ code: "custom", path: ["contents", index, "text"], message: contentRequired(cultures.find((culture) => culture.code === content.culture), t) }); });
  });
}
type LegalForm = z.infer<ReturnType<typeof legalFormSchema>>;

export function PublishLegalVersionPage() {
  const { t } = useTranslation(["platformLegal", "common", "enums"]); const [params] = useSearchParams(); const references = useReferenceData();
  const documents = useQuery({ queryKey: legalDocumentsQueryKey, queryFn: fetchLegalDocuments, meta: { silent: true, blocksView: true } });
  const kind = params.get("documento") === "Privacy" ? "Privacy" : "Terms";
  const cultures = enabledOptions(references.data?.cultures ?? []);
  useBreadcrumbLeaf(t("platformLegal:newVersion"));
  if (documents.isError && !documents.data) return <LoadErrorPage onRetry={() => { void documents.refetch(); }} />;
  if (!documents.data || !references.data) return <Page title={t("platformLegal:newVersion")}><p role="status">{t("common:states.loading")}</p></Page>;
  return <LegalVersionEditor key={`${kind}:${cultures.map((culture) => culture.code).join(",")}`} initialKind={kind} cultures={cultures} documents={documents.data} />;
}

function LegalVersionEditor({ initialKind, cultures, documents }: { initialKind: LegalDocumentKind; cultures: CultureReference[]; documents: PlatformLegalDocumentGroupResponse[] }) {
  const { t } = useTranslation(["platformLegal", "common", "enums"]); const format = useFormat(); const navigate = useNavigate(); const client = useQueryClient();
  const schema = useMemo(() => legalFormSchema(cultures, t), [cultures, t]);
  const { form } = useEditForm<undefined, LegalForm, LegalForm>({ read: undefined, toValues: () => ({ kind: initialKind, effectiveOn: null, dateValid: true, contents: cultures.map((culture) => ({ culture: culture.code, text: "" })) }), resolver: zodResolver(schema), reValidateMode: "onSubmit" });
  const kind = useController({ control: form.control, name: "kind" }); const date = useController({ control: form.control, name: "effectiveOn" });
  const [failure, setFailure] = useState<unknown>(); const [confirmation, setConfirmation] = useState<LegalPublicationOperation | null>(null); const [operation, setOperation] = useState<LegalPublicationOperation | null>(null);
  const operationId = useId(); const active = useRef(true); const draft = useRef(0); const choice = useRef(false);
  // useEditPage conserva el único blocker. Leemos su estado del router para coordinar los dos diálogos, sin props de React.
  const router = useContext(UNSAFE_DataRouterContext)?.router;
  const routerState = useContext(UNSAFE_DataRouterStateContext);
  const navigationBlocked = [...(routerState?.blockers.values() ?? [])].some((blocker) => blocker.state === "blocked");
  const navigation = useRef(router);
  // La referencia al router es estable; state es el actual incluso dentro del execute de un dueño anterior.
  const blocked = useCallback(() => [...(navigation.current?.state.blockers.values() ?? [])].some((blocker) => blocker.state === "blocked"), []);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const edit = useEditPage({ isDirty: form.formState.isDirty, error: failure, onSeeNew: () => { setFailure(undefined); }, onContinueEditing: () => setFailure(undefined) });
  const current = useCallback((sent: LegalPublicationOperation) => {
    const values = form.getValues();
    return active.current && !blocked() && choice.current && samePublication(sent, { kind: values.kind, effectiveOn: values.effectiveOn ?? "", contents: values.contents, draft: draft.current });
  }, [form, blocked]);
  const abandon = useCallback(() => { draft.current++; choice.current = false; setOperation(null); setConfirmation(null); setFailure(undefined); }, []);
  useEffect(() => {
    let wasBlocked = false;
    return router?.subscribe((state) => {
      const isBlocked = [...state.blockers.values()].some((blocker) => blocker.state === "blocked");
      if (isBlocked && !wasBlocked) abandon();
      wasBlocked = isBlocked;
    });
  }, [router, abandon]);
  const { setError } = form;
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "error" || event.mutation.meta?.legalPublication !== operationId) return;
    const sent = event.mutation.state.variables as LegalPublicationOperation | undefined; const error = event.mutation.state.error;
    if (!sent || !current(sent) || !(error instanceof ApiError)) return;
    setConfirmation(null);
    const fields: Record<string, "kind" | "effectiveOn" | `contents.${number}.text`> = { kind: "kind", effectiveOn: "effectiveOn" };
    sent.contents.forEach((_content, index) => { fields[`contents[${index}].text`] = `contents.${index}.text`; fields[`contents[${index}].Text`] = `contents.${index}.text`; });
    if (applyApiErrorToForm(error, setError, fields)) return;
    const field = legalErrorField(error);
    if (field) setError(field, { type: "server", message: error.detail ?? "" }); else setFailure(error);
  }), [client, operationId, current, setError]);
  const busy = useIsMutating({ predicate: (mutation) => {
    const sent = mutation.state.variables as LegalPublicationOperation | undefined;
    return mutation.meta?.legalPublication === operationId && !!sent && current(sent);
  } }) > 0;
  const number = nextVersion(documents.find((document) => document.kind === kind.field.value));
  const name = t(`enums:LegalDocumentKind.${kind.field.value}`);
  const execute = async (sent: LegalPublicationOperation, key: string) => {
    if (!current(sent)) throw new DOMException("", "AbortError");
    try {
      const response = await publishLegalDocument({ kind: sent.kind, effectiveOn: sent.effectiveOn, contents: sent.contents }, key);
      if (!current(sent)) throw new DOMException("", "AbortError");
      toast.success(t("platformLegal:published", { version: format.formatInteger(response.version), name: t(`enums:LegalDocumentKind.${sent.kind}`) }));
      choice.current = false; active.current = false; form.reset(); edit.allowNextNavigation(); void navigate("/plataforma/legales");
      void client.invalidateQueries({ queryKey: legalDocumentsQueryKey }); return response;
    } catch (error) {
      if (!current(sent)) throw new DOMException("", "AbortError");
      throw error;
    }
  };
  function submit(event: React.FormEvent<HTMLFormElement>) {
    const submittedDraft = draft.current;
    return form.handleSubmit((values) => {
      if (!active.current || blocked() || draft.current !== submittedDraft || !values.effectiveOn) return;
      setFailure(undefined); setConfirmation({ kind: values.kind, effectiveOn: values.effectiveOn, contents: values.contents, draft: submittedDraft });
    })(event);
  }
  const confirm = () => {
    const values = form.getValues();
    if (!confirmation || busy || !active.current || blocked() || !samePublication(confirmation, { kind: values.kind, effectiveOn: values.effectiveOn ?? "", contents: values.contents, draft: draft.current })) return;
    choice.current = true;
    setOperation(confirmation);
  };
  const title = t("platformLegal:newVersion");
  return <>
    {operation && !navigationBlocked ? <LegalPublicationOwner key={operation.draft} operation={operation} operationId={operationId} execute={execute} /> : null}
    <Page title={title} summary={t("platformLegal:draftSummary", { name, version: format.formatInteger(number) })} status={edit.unsaved ?? undefined} phoneSubtitle={edit.unsaved ?? name}
      backTo={{ to: "/plataforma/legales", label: t("platformLegal:backToList") }} banner={edit.banner}
      actions={<><Button type="button" variant="outline" onClick={() => { abandon(); void navigate("/plataforma/legales"); }}>{t("common:actions.cancel")}</Button><Button type="submit" form="legal-editor" pending={busy} pendingLabel={t("platformLegal:publishing")}>{t("platformLegal:publish")}</Button></>}>
      <Banner tone="warning">{t("platformLegal:warning")}</Banner>
      <form id="legal-editor" aria-label={title} noValidate onSubmit={(event) => { void submit(event); }} className="flex flex-col gap-3.5">
        {edit.formError}
        <Section title={t("platformLegal:versionTitle")} phone="untitled"><SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
          <FormField label={t("platformLegal:fields.document")} required error={form.formState.errors.kind?.message}>
            <Select value={kind.field.value} onValueChange={(value) => { abandon(); kind.field.onChange(value); form.clearErrors("kind"); }} disabled={busy}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="Terms">{t("enums:LegalDocumentKind.Terms")}</SelectItem><SelectItem value="Privacy">{t("enums:LegalDocumentKind.Privacy")}</SelectItem>
            </SelectContent></Select>
          </FormField>
          <FormField label={t("platformLegal:fields.effectiveOn")} required error={form.formState.errors.effectiveOn?.message}>
            <DateField value={date.field.value} disabled={busy} placeholder={t("platformLegal:datePlaceholder")} invalidMessage={form.formState.errors.effectiveOn ? null : t("platformLegal:validation.dateInvalid")}
              onValidityChange={(valid) => { form.setValue("dateValid", valid, { shouldDirty: true }); }} onChange={(value) => { abandon(); date.field.onChange(value); form.clearErrors("effectiveOn"); }} />
          </FormField>
        </SectionFields></Section>
        <Section title={t("platformLegal:contentTitle")} phone="inset"><SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
          {cultures.map((culture, index) => <FormField key={culture.code} label={contentLabel(culture, t)} required error={form.formState.errors.contents?.[index]?.text?.message}>
            <Textarea {...form.register(`contents.${index}.text`)} maxLength={legalDocumentMaxLength} disabled={busy} onChange={(event) => { abandon(); void form.register(`contents.${index}.text`).onChange(event); form.clearErrors(`contents.${index}.text`); }} />
          </FormField>)}
        </SectionFields></Section>
      </form>
    </Page>
    {confirmation && !navigationBlocked ? <Dialog open onOpenChange={(open) => { if (!open) abandon(); }}><DialogContent role="alertdialog" size="sm" showCloseButton={false}>
      <DialogHeader><DialogTitle>{t("platformLegal:confirmTitle", { version: format.formatInteger(number), name: t(`enums:LegalDocumentKind.${confirmation.kind}`) })}</DialogTitle></DialogHeader>
      <DialogBody><DialogDescription>{t("platformLegal:confirmDescription", { date: format.formatDate(confirmation.effectiveOn) })}</DialogDescription></DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={abandon}>{t("common:actions.cancel")}</Button><Button type="button" pending={busy} pendingLabel={t("platformLegal:publishing")} onClick={confirm}>{t("platformLegal:publish")}</Button></DialogFooter>
    </DialogContent></Dialog> : null}
    {edit.leaveDialog}
  </>;
}
