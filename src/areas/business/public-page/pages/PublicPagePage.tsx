import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useId, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { PublicPageResponse, TenantSlugAvailability, UpdatePublicPageRequest } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
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
import { phoneDraftFromE164 } from "@/shared/phone/phoneInput";
import { PhoneField, type PhoneDraft } from "@/shared/ui/fields/PhoneField";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { DateText } from "@/shared/ui/format/DateText";
import { initials } from "@/shared/lib/initials";
import { cn } from "@/shared/lib/utils";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { checkOrganizationSlug, fetchPublicPage, publicPageQueryKey, setPublicPagePublished, slugAvailabilityQueryKey, updatePublicPage } from "../api/publicPage";

interface PageDraft {
  slug: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: PhoneDraft | null;
  address: string;
  website: string;
  logoDataUri: string | null;
  uploadedLogoBase64: string | null;
  logoContentType: string | null;
  removeLogo: boolean;
}

// El dominio público de la plataforma; en desarrollo la URL real se arma con `publicUrl`.
const PUBLIC_DOMAIN = ".plataforma.com";

function draftFromPage(page: PublicPageResponse): PageDraft {
  return {
    slug: page.slug ?? "", name: page.name, description: page.description ?? "", contactEmail: page.contactEmail ?? "",
    contactPhone: phoneDraftFromE164(page.contactPhone), address: page.address ?? "", website: page.website ?? "",
    logoDataUri: page.logoDataUri ?? null, uploadedLogoBase64: null, logoContentType: null, removeLogo: false,
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
  const client = useQueryClient();
  const visibleId = useId();
  const page = useQuery({ queryKey: publicPageQueryKey, queryFn: fetchPublicPage, meta: { silent: true, blocksView: true } });
  const [draftState, setDraftState] = useState<PageDraft | null>(null);
  const draft = draftState ?? (page.data ? draftFromPage(page.data) : null);
  const debouncedSlug = useDebouncedValue(draft?.slug.trim() ?? "");
  const slugChanged = Boolean(page.data && draft && draft.slug !== (page.data.slug ?? ""));
  const slugAvailability = useQuery({
    queryKey: slugAvailabilityQueryKey(debouncedSlug),
    queryFn: () => checkOrganizationSlug(debouncedSlug),
    enabled: slugChanged && debouncedSlug.length > 0,
    meta: { silent: true },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blockedInfoOpen, setBlockedInfoOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const update = useMutation({
    mutationFn: updatePublicPage,
    // El error queda en `update.error`: el 409 va en su cartel y el resto, en la franja del formulario (useEditPage).
    onSuccess: async () => { setDraftState(null); toast.success(t("publicPage:saved")); await client.invalidateQueries({ queryKey: publicPageQueryKey }); },
  });
  // Tablero Pagina-Org: el interruptor de «Publicación» se aplica al momento, sin esperar a «Guardar cambios».
  const publication = useMutation({
    mutationFn: (published: boolean) => setPublicPagePublished(published, { version: page.data!.version }),
    onSuccess: async (_result, published) => { toast.success(t(published ? "publicPage:published" : "publicPage:unpublished")); await client.invalidateQueries({ queryKey: publicPageQueryKey }); },
    onError: (error) => toastActionError(error, t),
  });

  const pageData = page.data;
  const isDirty = Boolean(pageData && draft && JSON.stringify(draft) !== JSON.stringify(draftFromPage(pageData)));
  // Tableros Pagina-Org y Avisos: el 409 en su cartel, «Cambios sin guardar» después del estado, el error de guardado en
  // la franja del formulario y «¿Salir sin guardar?» antes de irse con cambios.
  const edit = useEditPage({
    isDirty, error: update.error,
    onSeeNew: () => { setDraftState(null); update.reset(); void page.refetch(); },
    onContinueEditing: () => update.reset(),
  });
  const blocked = pageData?.publishBlockedAtUtc != null;
  const slugState = slugAvailability.data?.availability;
  const canSave = Boolean(isDirty && draft && pageData);
  const savedSlug = pageData?.slug ?? "";

  async function chooseLogo(file: File | undefined) {
    if (!file || !draft) return;
    if (file.size > 512 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toastError(t("publicPage:invalidLogo"));
      return;
    }
    try {
      const image = await readImage(file);
      setDraftState({ ...draft, logoDataUri: image.dataUri, uploadedLogoBase64: image.base64, logoContentType: file.type, removeLogo: false });
    } catch {
      toastError(t("publicPage:invalidLogo"));
    }
  }

  function saveChanges() {
    if (!draft || !pageData) return;
    const request: UpdatePublicPageRequest = {
      slug: draft.slug.trim(), name: draft.name, description: draft.description, contactEmail: draft.contactEmail,
      contactPhone: draft.contactPhone?.number.trim() ? { country: draft.contactPhone.country, number: draft.contactPhone.number } : null,
      address: draft.address, website: draft.website,
      logoBase64: draft.uploadedLogoBase64, logoContentType: draft.logoContentType,
      removeLogo: draft.removeLogo, version: pageData.version,
    };
    update.mutate(request);
  }

  const stateDot = blocked ? "bg-[var(--peligro)]" : pageData?.isPublished ? "bg-[var(--punto-ok)]" : "bg-[var(--punto-apagado)]";
  const stateText = t(blocked ? "publicPage:states.blocked" : pageData?.isPublished ? "publicPage:states.published" : "publicPage:states.draft");
  const state = pageData ? <span className={`inline-flex items-center gap-1.5 ${blocked ? "text-[var(--peligro)]" : "text-[var(--t1)] max-md:text-[var(--t3)]"}`}>
    <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${stateDot}`} />{stateText}
  </span> : undefined;
  const summary = state ? <>{state}{edit.unsaved ? <><span aria-hidden="true">{" · "}</span>{edit.unsaved}</> : null}</> : undefined;
  // Tablero M-Pagina-Org: los campos van adentro de la tarjeta blanca, uno debajo del otro.

  // «Criterio · Avisos» (Pantalla de error): la página no cargó y no hay nada que mostrar.
  if (page.isError && !pageData) return <LoadErrorPage onRetry={() => { void page.refetch(); }} />;

  return <>
    <Page
      icon={Globe}
      title={t("publicPage:title")}
      banner={edit.banner}
      summary={summary}
      phoneSubtitle={summary}
      phoneBody="gray"
      barAction={pageData?.isPublished && pageData.slug
        ? { label: t("publicPage:view"), href: publicUrl(pageData.slug) }
        : { label: t("publicPage:preview"), onClick: () => setPreviewOpen(true) }}
      actions={<>
        <Button type="button" variant="outline" onClick={() => { setDraftState(null); update.reset(); }}>{t("publicPage:discard")}</Button>
        <Button type="button" disabled={!canSave} pending={update.isPending} onClick={saveChanges}>{t("publicPage:save")}</Button>
      </>}
    >
      <div className="flex flex-col gap-4 max-md:gap-0">
        {page.error ? <FormError message={apiErrorMessage(page.error, t)} /> : null}
        {/* La franja del error de guardado; en el teléfono va en la banda debajo de la barra (M-Pagina-Org, v106). */}
        {edit.formError}
        {page.isPending ? <p role="status" className="text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p> : draft && pageData ? <>
          <Section title={t("publicPage:publicationTitle")}>
            <div className="flex items-center gap-3 px-4 py-3 md:px-5 max-md:min-h-14 max-md:py-2 max-md:pr-3.5">
              <Globe aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)] max-md:hidden" />
              <span id={visibleId} className="min-w-0 truncate text-[13px] font-medium text-[var(--t1)] max-md:text-[15.5px]">{t("publicPage:visibleAt", { host: `${savedSlug}${PUBLIC_DOMAIN}` })}</span>
              {blocked ? <InfoButton label={t("publicPage:blockedInfo")} onClick={() => setBlockedInfoOpen(true)} /> : null}
              <Switch className="ml-auto" aria-labelledby={visibleId} checked={pageData.isPublished} disabled={blocked || !savedSlug || publication.isPending}
                onCheckedChange={(checked) => { if (checked) publication.mutate(true); else setUnpublishOpen(true); }} />
            </div>
          </Section>

          <Section title={t("publicPage:pageTitle")}>
            <div className="flex items-center gap-3 border-b border-[var(--borde)] px-4 py-2.5 md:px-5 max-md:gap-3.5 max-md:border-0 max-md:px-4 max-md:pt-3.5 max-md:pb-0">
              {draft.logoDataUri ? <img src={draft.logoDataUri} alt={t("publicPage:logoAlt")} className="size-9 rounded-[9px] object-contain max-md:size-14 max-md:rounded-[14px]" />
                : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-[9px] bg-[var(--marca-t)] text-[11.5px] font-bold text-[var(--marca-tx)] max-md:size-14 max-md:rounded-[14px] max-md:bg-[var(--marca)] max-md:text-[18px] max-md:font-bold max-md:text-[var(--lado-activo)]">{initials(draft.name)}</span>}
              <span className="text-[13px] font-medium text-[var(--t1)] max-md:sr-only">{t("publicPage:logoTitle")}</span>
              <span className="ml-auto flex items-center gap-2 max-md:ml-0">
                {draft.logoDataUri ? <Button type="button" variant="outline" size="sm" className="max-md:h-10 max-md:rounded-[10px] max-md:px-3.5 max-md:text-[14px]" onClick={() => setDraftState({ ...draft, logoDataUri: null, uploadedLogoBase64: null, logoContentType: null, removeLogo: true })}>{t("publicPage:removeLogo")}</Button> : null}
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
                  <FormField label={t("publicPage:fields.slug")} required>
                    <Input value={draft.slug} maxLength={63} autoComplete="off" className="pr-[124px] max-md:pr-[140px]" onChange={(event) => setDraftState({ ...draft, slug: event.target.value.toLowerCase() })} />
                  </FormField>
                  <span aria-hidden="true" className="absolute bottom-px right-px flex h-[32px] items-center rounded-r-[7px] border-l border-[var(--borde)] bg-[var(--s2)] px-3 text-[13px] text-[var(--t2)] lg:h-[34px] max-md:h-[46px] max-md:rounded-r-[11px] max-md:border-[var(--borde2)] max-md:bg-[var(--s3)] max-md:text-[15px]">{PUBLIC_DOMAIN}</span>
                </div>
                {slugChanged && slugState ? <p className={`text-[13px] ${slugState === "Available" ? "text-[var(--ok)]" : "text-[var(--peligro)]"}`}>{slugStateText(slugState, t)}</p> : null}
              </div>
              <FormField label={t("publicPage:fields.name")} required><Input value={draft.name} maxLength={120} onChange={(event) => setDraftState({ ...draft, name: event.target.value })} /></FormField>
              <div className="md:col-span-2"><FormField label={t("publicPage:fields.description")}><Textarea value={draft.description} maxLength={1000} onChange={(event) => setDraftState({ ...draft, description: event.target.value })} /></FormField></div>
            </SectionFields>
          </Section>

          <Section title={t("publicPage:contactTitle")}>
            <SectionFields className="grid gap-4 md:grid-cols-2 max-md:gap-3.5">
              <FormField label={t("publicPage:fields.email")}><Input type="email" value={draft.contactEmail} maxLength={254} onChange={(event) => setDraftState({ ...draft, contactEmail: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.phone")}><PhoneField value={draft.contactPhone} onChange={(contactPhone) => setDraftState({ ...draft, contactPhone })} /></FormField>
              <FormField label={t("publicPage:fields.address")}><Input value={draft.address} maxLength={500} onChange={(event) => setDraftState({ ...draft, address: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.website")}><Input type="url" value={draft.website} maxLength={2048} onChange={(event) => setDraftState({ ...draft, website: event.target.value })} /></FormField>
            </SectionFields>
          </Section>
        </> : null}
      </div>
    </Page>

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      {/* «Criterio · Diálogos»: el diálogo normal, de 560 (el tablero no dibuja la vista previa). */}
      <DialogContent>
        <DialogHeader><DialogTitle>{t("publicPage:preview")}</DialogTitle><DialogDescription className="sr-only">{t("publicPage:previewDescription")}</DialogDescription></DialogHeader>
        {draft ? <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center gap-3">{draft.logoDataUri ? <img src={draft.logoDataUri} alt={t("publicPage:logoAlt")} className="size-12 rounded-lg object-contain" /> : null}<h2 className="text-lg font-bold text-[var(--t1)]">{draft.name}</h2></div>
          {draft.description ? <p className="whitespace-pre-wrap text-[13px] text-[var(--t2)]">{draft.description}</p> : null}
          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            {draft.contactEmail ? <div><dt className="font-semibold">{t("publicPage:fields.email")}</dt><dd>{draft.contactEmail}</dd></div> : null}
            {draft.contactPhone?.number ? <div><dt className="font-semibold">{t("publicPage:fields.phone")}</dt><dd>{draft.contactPhone.number}</dd></div> : null}
            {draft.address ? <div><dt className="font-semibold">{t("publicPage:fields.address")}</dt><dd>{draft.address}</dd></div> : null}
            {draft.website ? <div><dt className="font-semibold">{t("publicPage:fields.website")}</dt><dd>{draft.website}</dd></div> : null}
          </dl>
        </div> : null}
        <DialogFooter><Button type="button" onClick={() => setPreviewOpen(false)}>{t("common:actions.close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Tablero Pagina-Org (despublicada, aviso abierto): el aviso importante compartido. */}
    <ImportantNotice open={blockedInfoOpen} onOpenChange={setBlockedInfoOpen} title={t("publicPage:blockedTitle")}
      reason={pageData?.publishBlockedReason ?? t("publicPage:blockedFallback")}
      detail={<Trans ns="publicPage" i18nKey="blockedOn" components={{ date: <DateText value={pageData?.publishBlockedAtUtc} kind="date" /> }} />}
      steps={[t("publicPage:blockedStep1"), t("publicPage:blockedStep2")]} />

    <ConfirmDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} title={t("publicPage:unpublishTitle")}
      description={t("publicPage:unpublishDescription", { host: `${savedSlug}${PUBLIC_DOMAIN}` })} confirmLabel={t("publicPage:unpublish")} destructive
      onConfirm={() => publication.mutate(false)} />
    {edit.leaveDialog}
  </>;
}
