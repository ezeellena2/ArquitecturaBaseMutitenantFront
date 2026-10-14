import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ChevronDown } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { companyOptions, roleOptions } from "@/shared/api/resourceOptions";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { phoneCountryOptions } from "@/shared/phone/countries";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/DataTable";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Page } from "@/shared/ui/Page";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Surface } from "@/shared/ui/Surface";
import { Textarea } from "@/shared/ui/textarea";
import type { WhatsAppPhoneImportPreviewResponse, WhatsAppPhoneImportRequest } from "../../api/types";
import { importPhones, previewPhoneImport } from "../api/phoneImports";
import { createPhoneImportColumns, phoneImportPhoneRow } from "../columns";
import { phoneImportErrorMessage } from "../errors";
import { phoneInputs, phoneLines, phoneLinesFromFile } from "../lib/phoneLines";

const usersPath = "/org/usuarios";
// «Ninguna» en el desplegable de Empresa: la empresa es opcional.
const noCompany = "none";
const maxPhones = validationConstraints.WhatsAppPhoneImportHttpRequest.phones.maxItems;

/// Se revisa al tocar «Revisar»: al menos un teléfono y hasta 200 (el tope del contrato).
function loadPhonesSchema(t: TFunction) {
  return z.object({
    text: z.string().superRefine((text, context) => {
      const count = phoneLines(text).length;
      if (count === 0) context.addIssue({ code: "custom", message: t("whatsapp:phones.form.phonesRequired") });
      else if (count > maxPhones) context.addIssue({ code: "custom", message: t("whatsapp:phones.form.tooMany", { count, max: maxPhones }) });
    }),
    companyId: z.string(),
    roleIds: z.array(z.string()),
  });
}

type LoadPhonesForm = z.input<ReturnType<typeof loadPhonesSchema>>;

/// Otro envío con lo mismo conserva la clave; con otra empresa, otros roles u otros teléfonos, va con una nueva.
function sameImport(previous: WhatsAppPhoneImportRequest, next: WhatsAppPhoneImportRequest): boolean {
  const phones = (request: WhatsAppPhoneImportRequest) => request.phones ?? [];
  const roles = (request: WhatsAppPhoneImportRequest) => request.roleIds ?? [];
  return previous.companyId === next.companyId
    && roles(previous).length === roles(next).length && roles(previous).every((id, index) => id === roles(next)[index])
    && phones(previous).length === phones(next).length
    && phones(previous).every((phone, index) => phone.country === phones(next)[index]?.country && phone.number === phones(next)[index]?.number);
}

/// «6 teléfonos · 2 ya son miembros · 3 invitaciones · 1 inválido», con los conteos del back y sin los que son cero.
function previewSummary(preview: WhatsAppPhoneImportPreviewResponse, t: TFunction, short: boolean): string {
  const parts = [t("whatsapp:phones.summary.phones", { count: preview.rows.length })];
  if (!short && preview.alreadyMembers > 0) parts.push(t("whatsapp:phones.summary.members", { count: preview.alreadyMembers }));
  if (preview.invites > 0) parts.push(t("whatsapp:phones.summary.invites", { count: preview.invites }));
  if (!short && preview.invalid > 0) parts.push(t("whatsapp:phones.summary.invalid", { count: preview.invalid }));
  return parts.join(" · ");
}

/**
 * «Cargar teléfonos de empleados» (tableros WA-Telefonos y M-WA-Telefonos), desde Usuarios: se pegan o se suben hasta
 * 200 teléfonos, cada uno con su país, con la empresa y los roles opcionales de los que se invitan. «Revisar» muestra qué
 * va a pasar con cada uno —ya es miembro (queda vinculado), se invita por WhatsApp o es un número inválido— sin decir
 * nunca si un número tiene cuenta (ADR 0038, precisión del 11/10), y confirmar vincula e invita de una vez.
 */
export function LoadPhonesPage() {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { phone } = useAppChrome();
  const navigate = useNavigate();
  const format = useFormat();
  useBreadcrumbLeaf(t("whatsapp:phones.breadcrumb"));
  const schema = useMemo(() => loadPhonesSchema(t), [t]);
  const form = useForm<LoadPhonesForm>({ resolver: zodResolver(schema), defaultValues: { text: "", companyId: "", roleIds: [] } });
  const company = useController({ control: form.control, name: "companyId" });
  const roleIds = useController({ control: form.control, name: "roleIds" });
  const text = useWatch({ control: form.control, name: "text" });
  const lines = phoneLines(text);
  const companies = useResourceOptions(companyOptions);
  const companyRoles = useResourceOptions(roleOptions("Company", company.field.value || undefined), Boolean(company.field.value));
  const roles = companyRoles.items.filter((role) => role.scope === "AnyCompany" || role.companyId === company.field.value);
  const file = useRef<HTMLInputElement>(null);
  const preview = useMutation({ mutationFn: (request: WhatsAppPhoneImportRequest) => previewPhoneImport(request) });
  const confirm = useIdempotentMutation((request: WhatsAppPhoneImportRequest, key) => importPhones(request, key), { meta: { handlesError: true }, sameOperation: sameImport });
  const [failure, setFailure] = useState<unknown>();
  const reviewed = preview.data;

  // Los teléfonos con el país de la cultura (telefonos.md, «País por defecto»); los que traen «+», con el suyo.
  function request(values: LoadPhonesForm, from: readonly string[]): WhatsAppPhoneImportRequest {
    const data = format.referenceData;
    const countries = phoneCountryOptions(data?.countries ?? []);
    const cultureCountry = data?.cultures.find((item) => item.code === format.culture)?.countryCode;
    const country = countries.find((item) => item.code === cultureCountry)?.code ?? countries[0]?.code ?? "";
    return { phones: phoneInputs(from, country, countries), companyId: values.companyId || null, roleIds: values.companyId ? values.roleIds : [] };
  }

  const review = form.handleSubmit((values) => {
    setFailure(undefined);
    preview.mutate(request(values, phoneLines(values.text)), { onError: setFailure });
  });

  function send() {
    setFailure(undefined);
    // Mientras se revisa, los teléfonos no se editan: son los mismos renglones que se revisaron.
    confirm.mutate(request(form.getValues(), lines), {
      onSuccess: (result) => {
        toast.success(t("whatsapp:phones.messages.done", { count: result.invited, linked: result.linked }));
        void navigate(usersPath);
      },
      onError: setFailure,
    });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    form.setValue("text", phoneLinesFromFile(await chosen.text()).join("\n"), { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  }

  function back() {
    if (reviewed) { preview.reset(); setFailure(undefined); }
    else void navigate(usersPath);
  }

  const reachable = reviewed ? reviewed.alreadyMembers + reviewed.invites : 0;
  const primary = reviewed
    ? <Button type="button" onClick={send} disabled={reachable === 0} pending={confirm.isPending} pendingLabel={t("whatsapp:phones.sending")}>
      {t("whatsapp:phones.confirm", { count: reviewed.invites })}
    </Button>
    : <Button type="submit" form="load-phones" pending={preview.isPending} pendingLabel={t("whatsapp:phones.reviewing")}>
      {t("whatsapp:phones.review", { count: lines.length })}
    </Button>;
  // Un número que el back no entendió no trae teléfono: se muestra lo que se escribió en su renglón (`row`, desde 1).
  const typed = (row: { row: number }) => lines[row.row - 1] ?? "";
  const message = reviewed ? phoneImportErrorMessage(failure, t) : actionErrorMessage(failure, t);

  return <Page title={t(phone ? "whatsapp:phones.phoneTitle" : "whatsapp:phones.title")} backTo={{ to: usersPath, label: t("whatsapp:phones.back") }}
    summary={reviewed ? previewSummary(reviewed, t, false) : t("whatsapp:phones.step")}
    phoneSubtitle={reviewed ? previewSummary(reviewed, t, true) : t("whatsapp:phones.step")}
    actions={phone ? primary : <><Button type="button" variant="outline" onClick={back}>{t("common:actions.cancel")}</Button>{primary}</>}>
    <form id="load-phones" noValidate onSubmit={(event) => { void review(event); }} className="flex flex-col gap-3.5">
      <FormError message={message} />
      <Section title={t("whatsapp:phones.invitees")}>
        <SectionFields className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
          <FormField label={t("whatsapp:phones.form.company")}>
            <SearchSelect value={company.field.value || noCompany} onChange={(value) => { company.field.onChange(value === noCompany ? "" : value); roleIds.field.onChange([]); }}
              remote={companies.remote} selectedLabel={companies.knownItems.find((item) => item.id === company.field.value)?.name}
              placeholder={t("whatsapp:phones.form.noCompany")} searchLabel={t("common:actions.search")} aria-label={t("whatsapp:phones.form.company")}
              options={[{ value: noCompany, label: t("whatsapp:phones.form.noCompany") }, ...companies.items.filter((item) => item.status === "Active").map((item) => ({ value: item.id, label: item.name }))]} />
          </FormField>
          <FormField label={t("whatsapp:phones.form.roles")}>
            {company.field.value
              ? <MultiSelect remote={companyRoles.remote} value={roleIds.field.value} onChange={roleIds.field.onChange} placeholder={t("whatsapp:phones.form.noRoles")}
                selectedOptions={companyRoles.knownItems.map((role) => ({ value: role.id, label: role.name }))}
                options={roles.map((role) => ({ value: role.id, label: role.name, description: role.description ?? undefined }))} />
              : <button type="button" disabled className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--s2)] px-3 text-left text-[13px] text-[var(--t3)] max-md:h-12 max-md:rounded-[12px] max-md:text-[16px]">
                {t("whatsapp:phones.form.chooseCompanyFirst")}<ChevronDown aria-hidden="true" className="size-4 shrink-0" />
              </button>}
          </FormField>
        </SectionFields>
      </Section>
      {reviewed
        ? <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={createPhoneImportColumns(t, typed)} rows={reviewed.rows} rowKey={(row) => String(row.row)}
            mobileRow={(row) => phoneImportPhoneRow(row, t, typed)} />
        </Surface>
        : <Section title={t("whatsapp:phones.phones")}>
          <SectionFields>
            <FormField label={t("whatsapp:phones.form.phones", { max: maxPhones })} required error={form.formState.errors.text?.message}
              aside={<button type="button" onClick={() => file.current?.click()} className="text-[12.5px] font-semibold text-[var(--marca-tx)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--foco)] max-md:text-[13.5px]">
                {t("whatsapp:phones.form.upload")}
              </button>}>
              <Textarea className="min-h-[190px]" {...form.register("text", { onChange: () => setFailure(undefined) })} />
            </FormField>
            <input ref={file} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(event) => { void upload(event); }} />
          </SectionFields>
        </Section>}
    </form>
  </Page>;
}
