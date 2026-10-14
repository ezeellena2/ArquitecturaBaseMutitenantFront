import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { isNotFoundError } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DateTimeField } from "@/shared/ui/fields/DateTimeField";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import { Section, SectionFields } from "@/shared/ui/Section";
import { homeOf } from "@/tenancy/access";
import { BroadcastsIcon } from "../../components/icons";
import type { CreateWhatsAppBroadcastRequest, WhatsAppBroadcastResponse, WhatsAppTemplateOptionResponse } from "../../api/types";
import {
  broadcastQueryKey, broadcastsQueryRoot, broadcastTagOptions, broadcastTemplateOptions, createBroadcast, estimateQueryKey, fetchBroadcast, fetchEstimate,
  findTemplateOption, type EstimateQuery,
} from "../api/broadcasts";
import { broadcastPath, broadcastsPath, duplicateSource } from "../columns";
import { ConfirmBroadcastDialog } from "../components/ConfirmBroadcastDialog";
import { EstimateLine, EstimateSummary, MessageBubble } from "../components/BroadcastPreview";
import { broadcastErrorField } from "../errors";
import { fillTemplate } from "../lib/broadcastText";

const variableLimit = validationConstraints.CreateWhatsAppBroadcastHttpRequest.variables.items.maxLength;

const nameMaxLength = validationConstraints.CreateWhatsAppBroadcastHttpRequest.name.maxLength;
const tagMaxLength = validationConstraints.WhatsAppAudienceInput.tag.maxLength;

function broadcastFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("whatsapp:broadcasts.form.nameRequired")).max(nameMaxLength),
    templateId: z.string().min(1, t("whatsapp:broadcasts.form.templateRequired")),
    variables: z.array(z.string().trim().min(1, t("whatsapp:broadcasts.form.variableRequired")).max(variableLimit)),
    kind: z.enum(["AllAccepting", "Tag"]),
    tag: z.string().max(tagMaxLength),
    when: z.enum(["now", "schedule"]),
    scheduledAtUtc: z.string().nullable(),
  }).superRefine((values, context) => {
    if (values.kind === "Tag" && !values.tag) context.addIssue({ code: "custom", path: ["tag"], message: t("whatsapp:broadcasts.form.tagRequired") });
    if (values.when === "schedule" && !values.scheduledAtUtc) context.addIssue({ code: "custom", path: ["scheduledAtUtc"], message: t("whatsapp:broadcasts.form.dateRequired") });
  });
}

type BroadcastForm = z.input<ReturnType<typeof broadcastFormSchema>>;
type BroadcastFormValues = z.output<ReturnType<typeof broadcastFormSchema>>;

const emptyForm: BroadcastForm = { name: "", templateId: "", variables: [], kind: "AllAccepting", tag: "", when: "now", scheduledAtUtc: null };
const sourcePage = { page: 1, pageSize: 10 } as const;

/// Duplicar (CC17): el nombre, la plantilla (si sigue aprobada) y a quiénes de la original; cuándo se elige de nuevo. Las
/// variables quedan vacías: la difusión no trae las que se usaron.
function valuesFromSource(source: WhatsAppBroadcastResponse, template: WhatsAppTemplateOptionResponse | null): BroadcastForm {
  return { ...emptyForm, name: source.name, templateId: template?.templateId ?? "", variables: (template?.variables ?? []).map(() => ""),
    kind: source.audience.kind, tag: source.audience.kind === "Tag" ? source.audience.tag ?? "" : "" };
}

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof BroadcastForm> = {
  name: "name", templateId: "templateId", variables: "variables", audience: "kind", "audience.kind": "kind", "audience.tag": "tag", scheduledAtUtc: "scheduledAtUtc",
};

function broadcastRequest(values: BroadcastFormValues): CreateWhatsAppBroadcastRequest {
  return {
    name: values.name, templateId: values.templateId, variables: values.variables,
    audience: { kind: values.kind, tag: values.kind === "Tag" ? values.tag : null },
    scheduledAtUtc: values.when === "schedule" ? values.scheduledAtUtc : null,
  };
}

/// Un reintento sin conexión repite la misma difusión; si se corrigió algo, es otra y va con otra clave.
function sameBroadcast(previous: CreateWhatsAppBroadcastRequest, next: CreateWhatsAppBroadcastRequest): boolean {
  const previousVariables = previous.variables ?? [];
  const nextVariables = next.variables ?? [];
  return previous.name === next.name && previous.templateId === next.templateId && previous.scheduledAtUtc === next.scheduledAtUtc
    && previous.audience?.kind === next.audience?.kind && previous.audience?.tag === next.audience?.tag
    && previousVariables.length === nextVariables.length && previousVariables.every((value, index) => value === nextVariables[index]);
}

/**
 * Nueva difusión (tableros WA-Difusion-Nueva y M-WA-Difusion-Nueva): el nombre, una plantilla de Marketing aprobada
 * (CC04) con sus variables, a quiénes (los que aceptan o una etiqueta de ellos), y mandarla ya o programarla en la zona
 * de la cuenta. La vista previa muestra el mensaje, cuántos lo reciben y el costo estimado, tal como los calcula el back;
 * el envío se confirma en un diálogo y es un alta idempotente. «Duplicar» llega con `?desde=<id>` y arranca con los datos
 * de la original.
 */
export function NewBroadcastPage(_props: ModuleContentProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const [params] = useSearchParams();
  const sourceId = params.get(duplicateSource) ?? "";
  const source = useQuery({ queryKey: broadcastQueryKey(sourceId, sourcePage), queryFn: () => fetchBroadcast(sourceId, sourcePage),
    enabled: Boolean(sourceId), meta: { silent: true, blocksView: true } });
  const original = source.data?.broadcast;
  const sourceTemplate = useQuery({ queryKey: [...broadcastsQueryRoot, "template-lookup", original?.template.id ?? ""],
    queryFn: ({ signal }) => original ? findTemplateOption(original.template, signal) : null, enabled: Boolean(original), meta: { silent: true } });
  useBreadcrumbLeaf(t("whatsapp:broadcasts.form.title"));
  const back = { to: broadcastsPath, label: t("whatsapp:broadcasts.back") };

  if (!sourceId) return <BroadcastEditor initial={emptyForm} />;
  if (source.isPending || (original && sourceTemplate.isPending)) return <Page icon={BroadcastsIcon} title={t("whatsapp:broadcasts.form.title")} backTo={back}>
    <p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
  </Page>;
  if (!original) return isNotFoundError(source.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("whatsapp:broadcasts.form.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void source.refetch(); }} screen={t("whatsapp:broadcasts.form.title")} back={back} />;
  const template = sourceTemplate.data ?? null;
  return <BroadcastEditor key={original.id} initial={valuesFromSource(original, template)} initialTemplate={template ?? undefined} />;
}

function BroadcastEditor({ initial, initialTemplate }: { initial: BroadcastForm; initialTemplate?: WhatsAppTemplateOptionResponse }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schema = useMemo(() => broadcastFormSchema(t), [t]);
  const form = useForm<BroadcastForm, unknown, BroadcastFormValues>({ defaultValues: initial, resolver: zodResolver(schema) });
  const { errors } = form.formState;
  const templateField = useController({ control: form.control, name: "templateId" });
  const kindField = useController({ control: form.control, name: "kind" });
  const tagField = useController({ control: form.control, name: "tag" });
  const whenField = useController({ control: form.control, name: "when" });
  const scheduleField = useController({ control: form.control, name: "scheduledAtUtc" });
  const [templateId, kind, tag, when, variables] = useWatch({ control: form.control, name: ["templateId", "kind", "tag", "when", "variables"] });
  const templates = useResourceOptions(broadcastTemplateOptions);
  const tags = useResourceOptions(broadcastTagOptions, kind === "Tag");
  const knownTemplates = [...templates.knownItems, ...(initialTemplate ? [initialTemplate] : [])];
  const template: WhatsAppTemplateOptionResponse | undefined = knownTemplates.find((option) => option.templateId === templateId);

  // CC04: cuántos la reciben y cuánto cuesta, con la plantilla y la audiencia elegidas. Solo a quienes aceptan: lo decide
  // el back; el front muestra lo que llega.
  const estimateQuery: EstimateQuery | null = templateId && (kind === "AllAccepting" || tag) ? { templateId, kind, tag: kind === "Tag" ? tag : undefined } : null;
  const estimate = useQuery({
    queryKey: estimateQueryKey(estimateQuery ?? { templateId: "", kind }), queryFn: ({ signal }) => fetchEstimate(estimateQuery!, signal),
    enabled: estimateQuery !== null, meta: { silent: true },
  });
  const estimateError = broadcastErrorField(estimate.error) && estimate.error instanceof ApiError ? { field: broadcastErrorField(estimate.error), message: estimate.error.detail ?? "" } : null;
  const estimateData = estimateQuery && !estimate.isError ? estimate.data : undefined;

  const [confirming, setConfirming] = useState<CreateWhatsAppBroadcastRequest | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const create = useIdempotentMutation((request: CreateWhatsAppBroadcastRequest, key) => createBroadcast(request, key), { sameOperation: sameBroadcast });
  const edit = useEditPage({ isDirty: form.formState.isDirty, error: undefined, onSeeNew: () => {}, onContinueEditing: () => {} });

  function chooseTemplate(next: string) {
    templateField.field.onChange(next);
    const chosen = knownTemplates.find((option) => option.templateId === next);
    form.setValue("variables", (chosen?.variables ?? []).map(() => ""), { shouldDirty: true });
  }

  // Lo que el back rechaza de un dato va debajo de ese dato y cierra la confirmación; lo demás queda en su franja.
  function rejected(error: unknown) {
    const field = broadcastErrorField(error);
    if (field && error instanceof ApiError) { form.setError(field, { type: "server", message: error.detail ?? "" }); setConfirming(null); return; }
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) { setConfirming(null); return; }
    setFailure(error);
  }

  const review = form.handleSubmit((values) => { setFailure(undefined); setConfirming(broadcastRequest(values)); });

  function send(request: CreateWhatsAppBroadcastRequest) {
    setFailure(undefined);
    create.mutate(request, {
      onSuccess: async (created) => {
        toast.success(t(request.scheduledAtUtc ? "whatsapp:broadcasts.form.scheduled" : "whatsapp:broadcasts.form.sent", { name: created.name }));
        edit.allowNextNavigation();
        void navigate(broadcastPath(created.id), { replace: true });
        await queryClient.invalidateQueries({ queryKey: broadcastsQueryRoot });
      },
      onError: rejected,
    });
  }

  const scheduled = when === "schedule";
  const submitLabel = t(scheduled ? "whatsapp:broadcasts.form.schedule" : "whatsapp:broadcasts.form.send");
  const kindError = errors.kind?.message ?? (estimateError?.field === "kind" ? estimateError.message : undefined);
  const templateError = errors.templateId?.message ?? (estimateError?.field === "templateId" ? estimateError.message : undefined);
  const templateLabel = (option: WhatsAppTemplateOptionResponse) => format.isLoading ? option.name
    : `${option.name} · ${format.formatEnum("WhatsAppTemplateCategory", option.category)}`;

  const fields = <SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
    <FormField label={t("whatsapp:broadcasts.form.name")} required error={errors.name?.message}>
      <Input {...form.register("name")} maxLength={nameMaxLength} autoComplete="off" />
    </FormField>
    <FormField label={t("whatsapp:broadcasts.form.template")} required error={templateError}>
      <SearchSelect value={templateField.field.value} onChange={chooseTemplate} remote={templates.remote}
        options={templates.items.map((option) => ({ value: option.templateId, label: templateLabel(option) }))}
        selectedLabel={template ? templateLabel(template) : undefined}
        placeholder={t("whatsapp:broadcasts.form.chooseTemplate")} searchLabel={t("common:actions.search")} />
    </FormField>
    {(template?.variables ?? []).map((variable, index) => <FormField key={`${templateId}-${index}`} label={variable} required error={errors.variables?.[index]?.message}>
      <Input maxLength={variableLimit} {...form.register(`variables.${index}`)} autoComplete="off" />
    </FormField>)}
    <FormField label={t("whatsapp:broadcasts.form.audience")} required error={kindError}>
      <RadioGroupField variant="segmented" label={t("whatsapp:broadcasts.form.audience")} value={kindField.field.value}
        onValueChange={(next) => kindField.field.onChange(next === "Tag" ? "Tag" : "AllAccepting")}
        options={[{ value: "AllAccepting", label: t(phone ? "whatsapp:broadcasts.form.allAcceptingShort" : "whatsapp:broadcasts.form.allAccepting") },
          { value: "Tag", label: t("whatsapp:broadcasts.form.oneTag") }]} />
    </FormField>
    {kind === "Tag" ? <FormField label={t("whatsapp:broadcasts.form.tag")} required error={errors.tag?.message}>
      <SearchSelect value={tagField.field.value} onChange={tagField.field.onChange} remote={tags.remote}
        options={tags.items.map((option) => ({ value: option, label: option }))} selectedLabel={tag || undefined}
        placeholder={t("whatsapp:broadcasts.form.chooseTag")} searchLabel={t("common:actions.search")} />
    </FormField> : null}
    <FormField label={t("whatsapp:broadcasts.form.when")}>
      <RadioGroupField variant="segmented" label={t("whatsapp:broadcasts.form.when")} value={whenField.field.value}
        onValueChange={(next) => whenField.field.onChange(next === "schedule" ? "schedule" : "now")}
        options={[{ value: "now", label: t("whatsapp:broadcasts.form.now") }, { value: "schedule", label: t("whatsapp:broadcasts.form.later") }]} />
    </FormField>
    {scheduled ? <FormField label={t("whatsapp:broadcasts.form.dateTime")} required error={errors.scheduledAtUtc?.message}>
      <DateTimeField value={scheduleField.field.value} onChange={scheduleField.field.onChange} />
    </FormField> : null}
  </SectionFields>;

  const preview = template ? <div className="grid items-start gap-4 px-5 pt-4 pb-5 md:grid-cols-2 max-md:px-0 max-md:pt-0">
    <MessageBubble text={fillTemplate(template.body, variables ?? [])} />
    {!phone && estimateData ? <EstimateSummary estimate={estimateData} kind={kind} tag={tag} /> : null}
  </div> : null;

  return <>
    <Page icon={BroadcastsIcon} title={t("whatsapp:broadcasts.form.title")} backTo={{ to: broadcastsPath, label: t("whatsapp:broadcasts.back") }}
      summary={t("whatsapp:broadcasts.form.draft")} phoneSubtitle={t("whatsapp:broadcasts.form.draft")} banner={edit.banner}
      actions={phone
        ? <><EstimateLine estimate={estimateData} /><Button type="submit" form="new-broadcast">{submitLabel}</Button></>
        : <>
          <Button variant="outline" asChild><Link to={broadcastsPath}>{t("common:actions.cancel")}</Link></Button>
          <Button type="submit" form="new-broadcast">{submitLabel}</Button>
        </>}>
      <form id="new-broadcast" noValidate aria-label={t("whatsapp:broadcasts.form.title")} onSubmit={(event) => { void review(event); }} className="flex flex-col gap-3.5">
        <Section title={t("whatsapp:broadcasts.form.section")} phone="untitled">{fields}</Section>
        {/* M-WA-Difusion-Nueva (.ap-gtit): en el teléfono, «Vista previa» en gris y la burbuja suelta, sin caja. */}
        {preview ? phone
          ? <section aria-labelledby="new-broadcast-preview" className="flex flex-col gap-2 pt-1.5">
            <h2 id="new-broadcast-preview" className="text-[13.5px] font-semibold text-[var(--t2)]">{t("whatsapp:broadcasts.preview.title")}</h2>{preview}
          </section>
          : <Section title={t("whatsapp:broadcasts.preview.title")}>{preview}</Section> : null}
      </form>
    </Page>
    {edit.leaveDialog}
    {confirming ? <ConfirmBroadcastDialog request={confirming} template={template} estimate={estimateData} pending={create.isPending} failure={failure}
      onConfirm={() => send(confirming)} onClose={() => { setConfirming(null); setFailure(undefined); }} /> : null}
  </>;
}
