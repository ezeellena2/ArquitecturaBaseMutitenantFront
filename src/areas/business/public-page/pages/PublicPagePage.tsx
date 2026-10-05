import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useId, useState } from "react";
import { useController, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { PublicPageResponse, TenantSlugAvailability, UpdatePublicPageRequest } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Button, buttonVariants } from "@/shared/ui/button";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { InfoButton } from "@/shared/ui/InfoButton";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Input } from "@/shared/ui/input";
import { phoneDraftFromE164, phoneE164FromDraft } from "@/shared/phone/phoneInput";
import { PhoneField, type PhoneDraft } from "@/shared/ui/fields/PhoneField";
import { Page } from "@/shared/ui/Page";
import { PublicPageCard, publicPageBackdropClass } from "@/shared/ui/PublicPageCard";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { DateText } from "@/shared/ui/format/DateText";
import { initials } from "@/shared/lib/initials";
import { cn } from "@/shared/lib/utils";
import { toastError } from "@/shared/ui/sonner";
import { checkOrganizationSlug, fetchPublicPage, publicPageQueryKey, setPublicPagePublished, slugAvailabilityQueryKey, updatePublicPage } from "../api/publicPage";

// El dominio público de la plataforma; en desarrollo la URL real se arma con `publicUrl`.
const PUBLIC_DOMAIN = ".plataforma.com";

/// La página pública no tiene reglas propias en la pantalla: lo que el back rechaza de un dato va debajo de ese dato, y
/// lo demás (la dirección tomada, el logo), en la franja. El logo es lo que se ve, la imagen nueva o el pedido de quitarlo.
const pageFormSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  contactEmail: z.string(),
  contactPhone: z.custom<PhoneDraft>().nullable(),
  address: z.string(),
  website: z.string(),
  logo: z.object({ dataUri: z.string().nullable(), base64: z.string().nullable(), contentType: z.string().nullable(), remove: z.boolean() }),
});
type PageForm = z.infer<typeof pageFormSchema>;

// Los errores de validación del back, en camelCase, a su campo.
const serverFields: Record<string, keyof PageForm> = {
  slug: "slug", name: "name", description: "description", contactEmail: "contactEmail", contactPhone: "contactPhone",
  "contactPhone.country": "contactPhone", "contactPhone.number": "contactPhone", address: "address", website: "website",
};

function valuesFromPage(page: PublicPageResponse): PageForm {
  return {
    slug: page.slug ?? "", name: page.name, description: page.description ?? "", contactEmail: page.contactEmail ?? "",
    contactPhone: phoneDraftFromE164(page.contactPhone), address: page.address ?? "", website: page.website ?? "",
    logo: { dataUri: page.logoDataUri ?? null, base64: null, contentType: null, remove: false },
  };
}

function pageRequest(values: PageForm, version: number): UpdatePublicPageRequest {
  return {
    slug: values.slug.trim(), name: values.name, description: values.description, contactEmail: values.contactEmail,
    contactPhone: values.contactPhone?.number.trim() ? { country: values.contactPhone.country, number: values.contactPhone.number } : null,
    address: values.address, website: values.website,
    logoBase64: values.logo.base64, logoContentType: values.logo.contentType, removeLogo: values.logo.remove, version,
  };
}

async function readImage(file: File): Promise<{ dataUri: string; base64: string }> {
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la imagen"));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
  return { dataUri, base64: dataUri.slice(dataUri.indexOf(",") + 1) };
}

function publicUrl(slug: string): string {
  const url = new URL(window.location.href);
  const host = url.hostname;
  const parts = host.split(".");
  const root = host === "localhost" || /^[\d.]+$/.test(host) ? "localhost" : parts.slice(-2).join(".");
  url.hostname = `${slug}.${root}`;
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function slugStateText(state: TenantSlugAvailability | undefined, t: (key: string) => string): string | undefined {
  if (!state) return undefined;
  return t(`publicPage:slug.${state}`);
}

export function PublicPagePage() {
  const { t } = useTranslation(["publicPage", "common"]);
  const page = useQuery({ queryKey: publicPageQueryKey, queryFn: fetchPublicPage, meta: { silent: true, blocksView: true } });

  // «Criterio · Avisos» (Pantalla de error): la página no cargó y no hay nada que mostrar.
  if (page.isError && !page.data) return <LoadErrorPage onRetry={() => { void page.refetch(); }} />;
  if (!page.data) return <Page icon={Globe} title={t("publicPage:title")}><p role="status" className="text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  return <PublicPageEditor page={page.data} loadError={page.error} reload={async () => (await page.refetch()).data} />;
}

/// La página pública de la organización (tableros Pagina-Org y M-Pagina-Org), como el editor de Roles: React Hook Form
/// con zod, la versión de `useEditForm`, y el 409, «Cambios sin guardar», la franja y «¿Salir sin guardar?» de
/// `useEditPage`. La publicación se aplica al momento, sin esperar a «Guardar cambios».
function PublicPageEditor({ page, loadError, reload }: { page: PublicPageResponse; loadError: unknown; reload: () => Promise<PublicPageResponse | undefined> }) {
  const { t } = useTranslation(["publicPage", "common"]);
  const client = useQueryClient();
  const visibleId = useId();
  const { form, version, resetTo, wrote } = useEditForm({ read: page, toValues: valuesFromPage, resolver: zodResolver(pageFormSchema) });
  const { errors } = form.formState;
  const slugField = useController({ control: form.control, name: "slug" });
  const phoneField = useController({ control: form.control, name: "contactPhone" });
  const [slug, name, description, contactEmail, contactPhone, address, website, logo] = useWatch({
    control: form.control, name: ["slug", "name", "description", "contactEmail", "contactPhone", "address", "website", "logo"],
  });
  const [failure, setFailure] = useState<unknown>();
  const isDirty = form.formState.isDirty;
  // Tableros Pagina-Org y Avisos: el 409 en su cartel, «Cambios sin guardar» después del estado, el error de guardado en
  // la franja del formulario y «¿Salir sin guardar?» antes de irse con cambios.
  const edit = useEditPage({
    isDirty, error: failure,
    onSeeNew: () => { void reload().then((fresh) => { if (fresh) resetTo(fresh); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
  });
  const savedSlug = page.slug ?? "";
  const debouncedSlug = useDebouncedValue(slug.trim());
  const slugChanged = slug !== savedSlug;
  const slugAvailability = useQuery({
    queryKey: slugAvailabilityQueryKey(debouncedSlug),
    queryFn: () => checkOrganizationSlug(debouncedSlug),
    enabled: slugChanged && debouncedSlug.length > 0,
    meta: { silent: true },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blockedInfoOpen, setBlockedInfoOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const update = useMutation({ mutationFn: updatePublicPage });
  // Tablero Pagina-Org: el interruptor de «Publicación» se aplica al momento, sin esperar a «Guardar cambios», sobre la
  // última lectura; si partió de lo que se está editando, su relectura pasa a ser la base y lo escrito se conserva.
  const publication = useMutation({
    mutationFn: async (published: boolean) => {
      const sentVersion = page.version;
      await setPublicPagePublished(published, { version: sentVersion });
      return sentVersion;
    },
    onSuccess: async (sentVersion, published) => {
      toast.success(t(published ? "publicPage:published" : "publicPage:unpublished"));
      await client.invalidateQueries({ queryKey: publicPageQueryKey });
      wrote(sentVersion, client.getQueryData<PublicPageResponse>(publicPageQueryKey));
    },
    onError: (error) => toastActionError(error, t),
  });

  const blocked = page.publishBlockedAtUtc != null;
  const slugState = slugAvailability.data?.availability;

  async function chooseLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > 512 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toastError(t("publicPage:invalidLogo"));
      return;
    }
    try {
      const image = await readImage(file);
      form.setValue("logo", { dataUri: image.dataUri, base64: image.base64, contentType: file.type, remove: false }, { shouldDirty: true });
    } catch {
      toastError(t("publicPage:invalidLogo"));
    }
  }

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    setFailure(error);
  }

  // La ficha queda limpia con lo guardado y, con la relectura, esa es la nueva base (`useEditForm`).
  async function saved(values: PageForm, sentVersion: number) {
    setFailure(undefined);
    form.reset(values);
    toast.success(t("publicPage:saved"));
    await client.invalidateQueries({ queryKey: publicPageQueryKey });
    wrote(sentVersion, client.getQueryData<PublicPageResponse>(publicPageQueryKey));
  }

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    update.mutate(pageRequest(values, version), { onSuccess: () => { void saved(values, version); }, onError: rejected });
  });

  // «Descartar cambios» vuelve a la última lectura de lo guardado, con su versión.
  function discard() {
    resetTo(page);
    setFailure(undefined);
  }

  const stateDot = blocked ? "bg-[var(--peligro)]" : page.isPublished ? "bg-[var(--punto-ok)]" : "bg-[var(--punto-apagado)]";
  const stateText = t(blocked ? "publicPage:states.blocked" : page.isPublished ? "publicPage:states.published" : "publicPage:states.draft");
  const state = <span className={`inline-flex items-center gap-1.5 ${blocked ? "text-[var(--peligro)]" : "text-[var(--t1)] max-md:text-[var(--t3)]"}`}>
    <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${stateDot}`} />{stateText}
  </span>;
  const summary = <>{state}{edit.unsaved ? <><span aria-hidden="true">{" · "}</span>{edit.unsaved}</> : null}</>;

  return <>
    <Page
      icon={Globe}
      title={t("publicPage:title")}
      banner={edit.banner}
      summary={summary}
      phoneSubtitle={summary}
      phoneBody="gray"
      barAction={page.isPublished && page.slug
        ? { label: t("publicPage:view"), href: publicUrl(page.slug) }
        : { label: t("publicPage:preview"), onClick: () => setPreviewOpen(true) }}
      actions={<>
        <Button type="button" variant="outline" onClick={discard}>{t("publicPage:discard")}</Button>
        <Button type="submit" form="public-page-editor" disabled={!isDirty} pending={update.isPending}>{t("publicPage:save")}</Button>
      </>}
    >
      {/* Tablero M-Pagina-Org: los campos van adentro de la tarjeta blanca, uno debajo del otro. */}
      <form id="public-page-editor" noValidate aria-label={t("publicPage:title")} onSubmit={(event) => { void submit(event); }} className="flex flex-col gap-4 max-md:gap-0">
        {loadError ? <FormError message={apiErrorMessage(loadError, t)} /> : null}
        {/* La franja del error de guardado; en el teléfono va en la banda debajo de la barra (M-Pagina-Org, v106). */}
        {edit.formError}
        <Section title={t("publicPage:publicationTitle")}>
          <div className="flex items-center gap-3 px-4 py-3 md:px-5 max-md:min-h-14 max-md:py-2 max-md:pr-3.5">
            <Globe aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)] max-md:hidden" />
            <span id={visibleId} className="min-w-0 truncate text-[13px] font-medium text-[var(--t1)] max-md:text-[15.5px]">{t("publicPage:visibleAt", { host: `${savedSlug}${PUBLIC_DOMAIN}` })}</span>
            {blocked ? <InfoButton label={t("publicPage:blockedInfo")} onClick={() => setBlockedInfoOpen(true)} /> : null}
            <Switch className="ml-auto" aria-labelledby={visibleId} checked={page.isPublished} disabled={blocked || !savedSlug || publication.isPending}
              onCheckedChange={(checked) => { if (checked) publication.mutate(true); else setUnpublishOpen(true); }} />
          </div>
        </Section>

        <Section title={t("publicPage:pageTitle")}>
          <div className="flex items-center gap-3 border-b border-[var(--borde)] px-4 py-2.5 md:px-5 max-md:gap-3.5 max-md:border-0 max-md:px-4 max-md:pt-3.5 max-md:pb-0">
            {logo.dataUri ? <img src={logo.dataUri} alt={t("publicPage:logoAlt")} className="size-9 rounded-[9px] object-contain max-md:size-14 max-md:rounded-[14px]" />
              : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-[9px] bg-[var(--marca-t)] text-[11.5px] font-bold text-[var(--marca-tx)] max-md:size-14 max-md:rounded-[14px] max-md:bg-[var(--marca)] max-md:text-[18px] max-md:font-bold max-md:text-[var(--lado-activo)]">{initials(name)}</span>}
            <span className="text-[13px] font-medium text-[var(--t1)] max-md:sr-only">{t("publicPage:logoTitle")}</span>
            <span className="ml-auto flex items-center gap-2 max-md:ml-0">
              {logo.dataUri ? <Button type="button" variant="outline" size="sm" className="max-md:h-10 max-md:rounded-[10px] max-md:px-3.5 max-md:text-[14px]"
                onClick={() => form.setValue("logo", { dataUri: null, base64: null, contentType: null, remove: true }, { shouldDirty: true })}>{t("publicPage:removeLogo")}</Button> : null}
              {/* Tablero Pagina-Org: «Subir imagen» es el botón chico con borde, como «Quitar logo». */}
              <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer max-md:h-10 max-md:rounded-[10px] max-md:px-3.5 max-md:text-[14px]")}>
                {t("publicPage:uploadLogo")}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void chooseLogo(event.target.files?.[0]); }} />
              </label>
            </span>
          </div>
          <SectionFields className="grid gap-4 md:grid-cols-2 max-md:gap-3.5">
            <div className="flex flex-col gap-1.5">
              {/* El sufijo va sobre el borde derecho del campo: FormField ata el rótulo a su único hijo, el Input. */}
              <div className="relative">
                <FormField label={t("publicPage:fields.slug")} required error={errors.slug?.message}>
                  <Input name={slugField.field.name} value={slugField.field.value} onBlur={slugField.field.onBlur} maxLength={63} autoComplete="off" className="pr-[124px] max-md:pr-[140px]"
                    onChange={(event) => slugField.field.onChange(event.target.value.toLowerCase())} />
                </FormField>
                <span aria-hidden="true" className="absolute bottom-px right-px flex h-[32px] items-center rounded-r-[7px] border-l border-[var(--borde)] bg-[var(--s2)] px-3 text-[13px] text-[var(--t2)] lg:h-[34px] max-md:h-[46px] max-md:rounded-r-[11px] max-md:border-[var(--borde2)] max-md:bg-[var(--s3)] max-md:text-[15px]">{PUBLIC_DOMAIN}</span>
              </div>
              {slugChanged && slugState ? <p className={`text-[13px] ${slugState === "Available" ? "text-[var(--ok)]" : "text-[var(--peligro)]"}`}>{slugStateText(slugState, t)}</p> : null}
            </div>
            <FormField label={t("publicPage:fields.name")} required error={errors.name?.message}><Input {...form.register("name")} maxLength={120} /></FormField>
            <div className="md:col-span-2"><FormField label={t("publicPage:fields.description")} error={errors.description?.message}><Textarea {...form.register("description")} maxLength={1000} /></FormField></div>
          </SectionFields>
        </Section>

        <Section title={t("publicPage:contactTitle")}>
          <SectionFields className="grid gap-4 md:grid-cols-2 max-md:gap-3.5">
            <FormField label={t("publicPage:fields.email")} error={errors.contactEmail?.message}><Input type="email" {...form.register("contactEmail")} maxLength={254} /></FormField>
            <FormField label={t("publicPage:fields.phone")} error={errors.contactPhone?.message}><PhoneField value={phoneField.field.value} onChange={phoneField.field.onChange} /></FormField>
            <FormField label={t("publicPage:fields.address")} error={errors.address?.message}><Input {...form.register("address")} maxLength={500} /></FormField>
            <FormField label={t("publicPage:fields.website")} error={errors.website?.message}><Input type="url" {...form.register("website")} maxLength={2048} /></FormField>
          </SectionFields>
        </Section>
      </form>
    </Page>

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      {/* Tableros Pagina-Org y M-Pagina-Org («Borrador: vista previa», v107): el diálogo de 640 (la excepción de «Criterio ·
          Diálogos») con la tarjeta de la página pública tal cual, sobre su fondo, y «Cerrar»; en el teléfono, la hoja
          desde abajo. Muestra lo que está escrito, aunque todavía no esté guardado. */}
      <DialogContent size="preview">
        <DialogHeader><DialogTitle>{t("publicPage:preview")}</DialogTitle><DialogDescription className="sr-only">{t("publicPage:previewDescription")}</DialogDescription></DialogHeader>
        <div className={cn(publicPageBackdropClass, "flex justify-center px-10 py-6 max-md:mt-2 max-md:mb-4 max-md:p-4")}>
          <PublicPageCard page={{ name, description, contactEmail, address, website, logoDataUri: logo.dataUri, contactPhone: phoneE164FromDraft(contactPhone) }} />
        </div>
        <DialogFooter><Button type="button" onClick={() => setPreviewOpen(false)}>{t("common:actions.close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Tablero Pagina-Org (despublicada, aviso abierto): el aviso importante compartido. */}
    <ImportantNotice open={blockedInfoOpen} onOpenChange={setBlockedInfoOpen} title={t("publicPage:blockedTitle")}
      reason={page.publishBlockedReason ?? t("publicPage:blockedFallback")}
      detail={<Trans ns="publicPage" i18nKey="blockedOn" components={{ date: <DateText value={page.publishBlockedAtUtc} kind="date" /> }} />}
      steps={[t("publicPage:blockedStep1"), t("publicPage:blockedStep2")]} />

    <ConfirmDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} title={t("publicPage:unpublishTitle")}
      description={t("publicPage:unpublishDescription", { host: `${savedSlug}${PUBLIC_DOMAIN}` })} confirmLabel={t("publicPage:unpublish")} destructive
      onConfirm={() => publication.mutate(false)} />
    {edit.leaveDialog}
  </>;
}
