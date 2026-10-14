import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { Textarea } from "@/shared/ui/textarea";
import type { CreateWhatsAppTemplateRequest, WhatsAppTemplateResponse } from "../../api/types";
import { createTemplate, templatesQueryRoot, type TemplateScope } from "../api/templates";
import { templateErrorField, templateErrorMessage } from "../errors";
import { insertPlaceholder, nextPlaceholder, placeholderNumbers, placeholdersInOrder, templateVariables } from "../lib/variables";
import { duplicateName } from "../lib/names";

const categories = ["Utility", "Marketing"] as const;
const limits = validationConstraints.CreateWhatsAppTemplateHttpRequest;
const variableLimits = validationConstraints.WhatsAppTemplateVariableInput;

/// Se revisa al tocar el botón: el nombre, el texto con sus datos numerados desde 1 y, de cada dato, cómo se llama y un
/// ejemplo, que Meta pide para revisarla.
function templateFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("whatsapp:templates.form.nameRequired")),
    category: z.enum(categories),
    body: z.string().trim().min(1, t("whatsapp:templates.form.bodyRequired")),
    entries: z.record(z.string(), z.object({ label: z.string(), example: z.string() })),
  }).superRefine((values, context) => {
    if (!placeholdersInOrder(values.body)) context.addIssue({ code: "custom", path: ["body"], message: t("whatsapp:templates.form.variablesOutOfOrder") });
    for (const number of placeholderNumbers(values.body)) {
      const entry = values.entries[number];
      if (!entry?.label.trim()) context.addIssue({ code: "custom", path: ["entries", String(number), "label"], message: t("whatsapp:templates.form.variableLabelRequired") });
      if (!entry?.example.trim()) context.addIssue({ code: "custom", path: ["entries", String(number), "example"], message: t("whatsapp:templates.form.variableExampleRequired") });
    }
  });
}

type TemplateForm = z.input<ReturnType<typeof templateFormSchema>>;
type TemplateValues = z.output<ReturnType<typeof templateFormSchema>>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, "name" | "category" | "body"> = { name: "name", category: "category", body: "body", variables: "body" };

/// Otro envío con lo mismo conserva la clave del alta; con algo corregido, va con una nueva (datos-y-api.md).
function sameTemplate(previous: CreateWhatsAppTemplateRequest, next: CreateWhatsAppTemplateRequest): boolean {
  const before = previous.variables ?? [];
  const after = next.variables ?? [];
  return previous.name === next.name && previous.category === next.category && previous.language === next.language && previous.body === next.body
    && before.length === after.length && before.every((variable, index) => variable.label === after[index]?.label && variable.example === after[index]?.example);
}

/// Lo de empezar: vacío o, al duplicar (CC17), lo de la original. Meta no devuelve los ejemplos de los datos: se
/// vuelven a escribir.
function initialValues(original: WhatsAppTemplateResponse | undefined): TemplateForm {
  if (!original) return { name: "", category: "Utility", body: "", entries: {} };
  return {
    name: duplicateName(original.name, limits.name.maxLength), category: original.category === "Marketing" ? "Marketing" : "Utility", body: original.body,
    entries: Object.fromEntries(original.variables.map((label, index) => [String(index + 1), { label, example: "" }])),
  };
}

/**
 * «Nueva plantilla» (tableros WA-Plantilla-Nueva y M-WA-Plantilla-Nueva): el nombre, el tipo (Utilidad o Marketing) y el
 * texto, con «Nombre del contacto» y «Otro dato» para sumar datos, que se escriben `{{1}}`, `{{2}}`… como los numera
 * Meta. Va en la cultura del catálogo de quien la escribe (el back la traduce a la de Meta) y se manda a Meta a revisión.
 * «Duplicar» abre este mismo diálogo con los datos y el idioma de la original, y crea otra.
 */
export function TemplateDialog({ scope, original, onClose, returnFocusTo }: {
  scope: TemplateScope;
  original?: WhatsAppTemplateResponse;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const queryClient = useQueryClient();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const schema = useMemo(() => templateFormSchema(t), [t]);
  const [failure, setFailure] = useState<unknown>();
  const form = useForm<TemplateForm, unknown, TemplateValues>({ resolver: zodResolver(schema), defaultValues: initialValues(original) });
  const category = useController({ control: form.control, name: "category" });
  const bodyField = form.register("body", { onChange: () => setFailure(undefined) });
  const bodyElement = useRef<HTMLTextAreaElement | null>(null);
  const body = useWatch({ control: form.control, name: "body" });
  const numbers = placeholderNumbers(body);
  const full = numbers.length >= limits.variables.maxItems;
  const send = useIdempotentMutation((request: CreateWhatsAppTemplateRequest, key) => createTemplate(scope, request, key), { meta: { handlesError: true }, sameOperation: sameTemplate });
  const errors = form.formState.errors;

  function addVariable(label: string) {
    const current = form.getValues("body");
    const number = nextPlaceholder(current);
    const element = bodyElement.current;
    const inserted = insertPlaceholder(current, number, element?.selectionStart ?? current.length, element?.selectionEnd ?? undefined);
    form.setValue("body", inserted.body, { shouldDirty: true });
    form.setValue(`entries.${number}`, { label, example: "" }, { shouldDirty: true });
  }

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    const field = templateErrorField(error);
    if (field && error instanceof ApiError) form.setError(field, { type: "server", message: error.detail ?? "" });
    else setFailure(error);
  }

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    const enabled = format.referenceData?.cultures.filter((culture) => culture.isEnabled).map((culture) => culture.code) ?? [];
    const language = original?.languages.find((code) => enabled.includes(code)) ?? format.culture;
    const request: CreateWhatsAppTemplateRequest = { name: values.name, category: values.category, language, body: values.body,
      variables: templateVariables(values.body, values.entries) };
    send.mutate(request, {
      onSuccess: async () => {
        toast.success(t("whatsapp:templates.messages.sent", { name: request.name }));
        onClose();
        await queryClient.invalidateQueries({ queryKey: templatesQueryRoot(scope) });
      },
      onError: rejected,
    });
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:templates.create")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <div className="grid gap-3.5 md:grid-cols-2">
            <FormField label={t("whatsapp:templates.form.name")} required error={errors.name?.message}>
              <Input autoComplete="off" maxLength={limits.name.maxLength} {...form.register("name", { onChange: () => setFailure(undefined) })} />
            </FormField>
            <FormField label={t("whatsapp:templates.form.category")} required error={errors.category?.message}>
              <RadioGroupField variant="segmented" label={t("whatsapp:templates.form.category")} value={category.field.value}
                options={categories.map((value) => ({ value, label: t(`enums:WhatsAppTemplateCategory.${value}`) }))}
                onValueChange={(value) => category.field.onChange(value)} />
            </FormField>
            <div className="flex flex-col gap-2 md:col-span-2">
              <FormField label={t("whatsapp:templates.form.body")} required error={errors.body?.message}>
                <Textarea maxLength={limits.body.maxLength} className="min-h-[110px]" {...bodyField}
                  ref={(element) => { bodyField.ref(element); bodyElement.current = element; }} />
              </FormField>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => addVariable(t("whatsapp:templates.form.contactNameLabel"))}>
                  <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:templates.form.contactName")}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => addVariable("")}>
                  <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:templates.form.otherData")}
                </Button>
              </div>
            </div>
            {numbers.map((number) => <div key={number} className="contents">
              <FormField label={t("whatsapp:templates.form.variableLabel", { number })} required error={errors.entries?.[number]?.label?.message}>
                <Input autoComplete="off" maxLength={variableLimits.label.maxLength} {...form.register(`entries.${number}.label`)} />
              </FormField>
              <FormField label={t("whatsapp:templates.form.variableExample", { number })} required error={errors.entries?.[number]?.example?.message}>
                <Input autoComplete="off" maxLength={variableLimits.example.maxLength} {...form.register(`entries.${number}.example`)} />
              </FormField>
            </div>)}
          </div>
          <FormError message={templateErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button type="submit" pending={send.isPending} pendingLabel={t("whatsapp:templates.sending")}>{t("whatsapp:templates.send")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
