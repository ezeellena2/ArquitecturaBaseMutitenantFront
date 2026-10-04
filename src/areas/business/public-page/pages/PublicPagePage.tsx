import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Globe, Globe2, Info } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import type { PublicPageResponse, TenantSlugAvailability, UpdatePublicPageRequest } from "@/shared/api/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { phoneDraftFromE164 } from "@/shared/phone/phoneInput";
import { PhoneField, type PhoneDraft } from "@/shared/ui/fields/PhoneField";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { DateText } from "@/shared/ui/format/DateText";
import { initials } from "@/shared/lib/initials";
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

function Box({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return <Surface className="overflow-hidden">
    <section aria-labelledby={id}>
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2 id={id}>{title}</h2>{action}</header>
      {children}
    </section>
  </Surface>;
}

export function PublicPagePage() {
  const { t } = useTranslation(["publicPage", "common"]);
  const { data: currentUser } = useCurrentUser();
  const canManage = currentUser?.permissions?.includes("publicpage.manage") === true;
  const client = useQueryClient();
  const visibleId = useId();
  const page = useQuery({ queryKey: publicPageQueryKey, queryFn: fetchPublicPage, enabled: canManage, meta: { silent: true } });
  const [draftState, setDraftState] = useState<PageDraft | null>(null);
  const draft = draftState ?? (page.data ? draftFromPage(page.data) : null);
  const debouncedSlug = useDebouncedValue(draft?.slug.trim() ?? "");
  const slugChanged = Boolean(page.data && draft && draft.slug !== (page.data.slug ?? ""));
  const slugAvailability = useQuery({
    queryKey: slugAvailabilityQueryKey(debouncedSlug),
    queryFn: () => checkOrganizationSlug(debouncedSlug),
    enabled: canManage && slugChanged && debouncedSlug.length > 0,
    meta: { silent: true },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blockedInfoOpen, setBlockedInfoOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const update = useMutation({
    mutationFn: updatePublicPage,
    onSuccess: async () => { setDraftState(null); toast.success(t("publicPage:saved")); await client.invalidateQueries({ queryKey: publicPageQueryKey }); },
    onError: (error) => toastError(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });
  // Tablero Pagina-Org: el interruptor de «Publicación» se aplica al momento, sin esperar a «Guardar cambios».
  const publication = useMutation({
    mutationFn: (published: boolean) => setPublicPagePublished(published, { version: page.data!.version }),
    onSuccess: async (_result, published) => { toast.success(t(published ? "publicPage:published" : "publicPage:unpublished")); await client.invalidateQueries({ queryKey: publicPageQueryKey }); },
    onError: (error) => toastError(error instanceof ApiError ? error.detail ?? t("common:states.error") : t("common:states.error")),
  });

  if (!canManage) return <ForbiddenPage homePath="/org" />;

  const pageData = page.data;
  const isDirty = Boolean(pageData && draft && JSON.stringify(draft) !== JSON.stringify(draftFromPage(pageData)));
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

  const stateDot = blocked ? "bg-[var(--peligro)]" : pageData?.isPublished ? "bg-[var(--ok)]" : "bg-[var(--t3)]";
  const stateText = t(blocked ? "publicPage:states.blocked" : pageData?.isPublished ? "publicPage:states.published" : "publicPage:states.draft");

  return <>
    <Page
      icon={Globe2}
      title={t("publicPage:title")}
      summary={pageData ? <span className={`inline-flex items-center gap-1.5 ${blocked ? "text-[var(--peligro)]" : "text-[var(--t1)]"}`}>
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${stateDot}`} />{stateText}
      </span> : undefined}
      actions={<>
        {pageData?.isPublished && pageData.slug
          ? <Button type="button" variant="outline" asChild><a href={publicUrl(pageData.slug)} target="_blank" rel="noreferrer">{t("publicPage:view")}</a></Button>
          : <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>{t("publicPage:preview")}</Button>}
        <Button type="button" variant="outline" onClick={() => setDraftState(null)}>{t("publicPage:discard")}</Button>
        <Button type="button" disabled={!canSave || update.isPending} onClick={saveChanges}>{update.isPending ? t("common:states.saving") : t("publicPage:save")}</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        {page.error ? <FormError message={page.error instanceof ApiError ? page.error.detail ?? t("common:states.error") : t("common:states.error")} /> : null}
        {page.isPending ? <p role="status" className="text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p> : draft && pageData ? <>
          <Box title={t("publicPage:publicationTitle")}>
            <div className="flex items-center gap-3 px-4 py-3 md:px-5">
              <Globe aria-hidden="true" className="size-4 shrink-0 text-[var(--t3)]" />
              <span id={visibleId} className="min-w-0 truncate text-[13px] text-[var(--t1)]">{t("publicPage:visibleAt", { host: `${savedSlug}${PUBLIC_DOMAIN}` })}</span>
              {blocked ? <button type="button" aria-label={t("publicPage:blockedInfo")} title={t("publicPage:blockedInfo")} onClick={() => setBlockedInfoOpen(true)}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--peligro)] hover:bg-[var(--peligro-t)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]"><Info aria-hidden="true" className="size-4" /></button> : null}
              <Switch className="ml-auto" aria-labelledby={visibleId} checked={pageData.isPublished} disabled={blocked || !savedSlug || publication.isPending}
                onCheckedChange={(checked) => { if (checked) publication.mutate(true); else setUnpublishOpen(true); }} />
            </div>
          </Box>

          <Box title={t("publicPage:pageTitle")}>
            <div className="flex items-center gap-3 border-b border-[var(--borde)] px-4 py-2.5 md:px-5">
              {draft.logoDataUri ? <img src={draft.logoDataUri} alt={t("publicPage:logoAlt")} className="size-9 rounded-[9px] object-contain" />
                : <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-[9px] bg-[var(--marca-t)] text-[12px] font-semibold text-[var(--marca-tx)]">{initials(draft.name)}</span>}
              <span className="text-[13px] text-[var(--t1)]">{t("publicPage:logoTitle")}</span>
              <span className="ml-auto flex items-center gap-2">
                {draft.logoDataUri ? <Button type="button" variant="outline" size="sm" onClick={() => setDraftState({ ...draft, logoDataUri: null, uploadedLogoBase64: null, logoContentType: null, removeLogo: true })}>{t("publicPage:removeLogo")}</Button> : null}
                <label className="inline-flex h-7 cursor-pointer items-center rounded-[7px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-2.5 text-[12.5px] font-medium text-[var(--t1)] hover:bg-[var(--s2)] lg:h-8 lg:rounded-[8px] lg:px-3 lg:text-[13px]">
                  {t("publicPage:uploadLogo")}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void chooseLogo(event.target.files?.[0]); }} />
                </label>
              </span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
              <div className="flex flex-col gap-1.5">
                {/* El sufijo va sobre el borde derecho del campo: FormField ata el rótulo a su único hijo, el Input. */}
                <div className="relative">
                  <FormField label={t("publicPage:fields.slug")} required>
                    <Input value={draft.slug} maxLength={63} autoComplete="off" className="pr-[124px]" onChange={(event) => setDraftState({ ...draft, slug: event.target.value.toLowerCase() })} />
                  </FormField>
                  <span aria-hidden="true" className="absolute bottom-px right-px flex h-[32px] items-center rounded-r-[7px] border-l border-[var(--borde)] bg-[var(--s2)] px-3 text-[13px] text-[var(--t2)] lg:h-[34px]">{PUBLIC_DOMAIN}</span>
                </div>
                {slugChanged && slugState ? <p className={`text-[13px] ${slugState === "Available" ? "text-[var(--ok)]" : "text-[var(--peligro)]"}`}>{slugStateText(slugState, t)}</p> : null}
              </div>
              <FormField label={t("publicPage:fields.name")} required><Input value={draft.name} maxLength={120} onChange={(event) => setDraftState({ ...draft, name: event.target.value })} /></FormField>
              <div className="md:col-span-2"><FormField label={t("publicPage:fields.description")}><Textarea value={draft.description} maxLength={1000} className="min-h-[88px] resize-y" onChange={(event) => setDraftState({ ...draft, description: event.target.value })} /></FormField></div>
            </div>
          </Box>

          <Box title={t("publicPage:contactTitle")}>
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
              <FormField label={t("publicPage:fields.email")}><Input type="email" value={draft.contactEmail} maxLength={254} onChange={(event) => setDraftState({ ...draft, contactEmail: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.phone")}><PhoneField value={draft.contactPhone} onChange={(contactPhone) => setDraftState({ ...draft, contactPhone })} /></FormField>
              <FormField label={t("publicPage:fields.address")}><Input value={draft.address} maxLength={500} onChange={(event) => setDraftState({ ...draft, address: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.website")}><Input type="url" value={draft.website} maxLength={2048} onChange={(event) => setDraftState({ ...draft, website: event.target.value })} /></FormField>
            </div>
          </Box>
        </> : null}
      </div>
    </Page>

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="md:max-w-[600px]">
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

    {/* Aviso importante (Criterio-Avisos): el motivo destacado en rojo suave y «Qué podés hacer» en pasos. */}
    <Dialog open={blockedInfoOpen} onOpenChange={setBlockedInfoOpen}>
      <DialogContent className="md:max-w-[420px]" showCloseButton>
        <DialogHeader><DialogTitle>{t("publicPage:blockedTitle")}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 px-5 py-4 text-[13px]">
          {/* Tablero Pagina-Org (despublicada, aviso abierto): motivo en bordó y negrita; pasos en un círculo gris relleno. */}
          <div className="flex items-start gap-3 rounded-[10px] bg-[var(--peligro-t)] px-4 py-3.5 text-[var(--peligro-tx)]">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col">
              <strong className="text-[15px] font-semibold">{pageData?.publishBlockedReason ?? t("publicPage:blockedFallback")}</strong>
              <span className="text-[12.5px]"><Trans ns="publicPage" i18nKey="blockedOn" components={{ date: <DateText value={pageData?.publishBlockedAtUtc} kind="date" /> }} /></span>
            </div>
          </div>
          <span className="text-[12.5px] font-semibold text-[var(--t3)]">{t("publicPage:whatCanYouDo")}</span>
          <ol className="flex flex-col gap-2.5">
            {[t("publicPage:blockedStep1"), t("publicPage:blockedStep2")].map((step, index) => <li key={step} className="flex items-center gap-2.5 text-[13.5px] text-[var(--t1)]">
              <span aria-hidden="true" data-step-number className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[12px] font-semibold text-[var(--t2)]">{index + 1}</span>{step}
            </li>)}
          </ol>
        </div>
        <DialogFooter><Button type="button" onClick={() => setBlockedInfoOpen(false)}>{t("publicPage:understood")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} title={t("publicPage:unpublishTitle")}
      description={t("publicPage:unpublishDescription", { host: `${savedSlug}${PUBLIC_DOMAIN}` })} confirmLabel={t("publicPage:unpublish")} destructive
      onConfirm={() => publication.mutate(false)} />
  </>;
}
