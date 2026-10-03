import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Globe2, Info, ImagePlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import { Textarea } from "@/shared/ui/textarea";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { checkOrganizationSlug, fetchPublicPage, publicPageQueryKey, setPublicPagePublished, slugAvailabilityQueryKey, updatePublicPage } from "../api/publicPage";

interface PageDraft {
  slug: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  logoDataUri: string | null;
  uploadedLogoBase64: string | null;
  logoContentType: string | null;
  removeLogo: boolean;
}

function draftFromPage(page: PublicPageResponse): PageDraft {
  return {
    slug: page.slug ?? "", name: page.name, description: page.description ?? "", contactEmail: page.contactEmail ?? "",
    contactPhone: page.contactPhone ?? "", address: page.address ?? "", website: page.website ?? "",
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
  const { data: currentUser } = useCurrentUser();
  const canManage = currentUser?.permissions?.includes("publicpage.manage") === true;
  const client = useQueryClient();
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
      contactPhone: draft.contactPhone, address: draft.address, website: draft.website,
      logoBase64: draft.uploadedLogoBase64, logoContentType: draft.logoContentType,
      removeLogo: draft.removeLogo, version: pageData.version,
    };
    update.mutate(request);
  }

  return <>
    <Page
      icon={Globe2}
      title={t("publicPage:title")}
      summary={<span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className={`size-2 rounded-full ${blocked ? "bg-[var(--peligro)]" : pageData?.isPublished ? "bg-[var(--ok)]" : "bg-[var(--t3)]"}`} />
        {t(blocked ? "publicPage:states.blocked" : pageData?.isPublished ? "publicPage:states.published" : "publicPage:states.draft")}
        {pageData?.isPublished && !blocked && pageData.slug ? <span className="text-[var(--t2)]">{" · "}{`${pageData.slug}.plataforma.com`}</span> : null}
        {blocked ? <Button type="button" variant="ghost" size="icon-sm" aria-label={t("publicPage:blockedInfo")} onClick={() => setBlockedInfoOpen(true)}><Info aria-hidden="true" className="size-4" /></Button> : null}
      </span>}
      actions={<>
        {pageData?.isPublished && pageData.slug ? <Button type="button" variant="outline" asChild><a href={publicUrl(pageData.slug)} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" />{t("publicPage:view")}</a></Button> : <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>{t("publicPage:preview")}</Button>}
        {pageData?.isPublished ? <Button type="button" variant="outline" disabled={publication.isPending} onClick={() => setUnpublishOpen(true)}>{t("publicPage:unpublish")}</Button>
          : <Button type="button" disabled={blocked || isDirty || publication.isPending} onClick={() => publication.mutate(true)}>{t("publicPage:publish")}</Button>}
        {isDirty && draft ? <Button type="button" variant="outline" onClick={() => setDraftState(pageData ? draftFromPage(pageData) : null)}>{t("publicPage:discard")}</Button> : null}
        <Button type="button" disabled={!canSave || update.isPending} onClick={saveChanges}>{t("publicPage:save")}</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        {page.error ? <FormError message={page.error instanceof ApiError ? page.error.detail ?? t("common:states.error") : t("common:states.error")} /> : null}
        {page.isPending ? <p role="status" className="text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p> : draft && pageData ? <>
          <Surface className="overflow-hidden">
            <header className="flex min-h-10 items-center justify-between border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("publicPage:pageData")}</h2></header>
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
              <FormField label={t("publicPage:fields.slug")} required><Input value={draft.slug} disabled={!canManage} maxLength={63} autoComplete="off" onChange={(event) => setDraftState({ ...draft, slug: event.target.value.toLowerCase() })} /></FormField>
              <div className="flex items-end pb-2 text-[13px] text-[var(--t2)]">{draft.slug ? <>{draft.slug}{".plataforma.com"}</> : t("publicPage:slug.empty")}</div>
              {slugChanged && slugState ? <p className={`text-[13px] ${slugState === "Available" ? "text-[var(--ok)]" : "text-[var(--peligro)]"}`}>{slugStateText(slugState, t)}</p> : null}
              <FormField label={t("publicPage:fields.name")} required><Input value={draft.name} maxLength={120} onChange={(event) => setDraftState({ ...draft, name: event.target.value })} /></FormField>
              <div className="md:col-span-2"><FormField label={t("publicPage:fields.description")}><Textarea value={draft.description} maxLength={1000} className="min-h-[88px] resize-y" onChange={(event) => setDraftState({ ...draft, description: event.target.value })} /></FormField></div>
            </div>
          </Surface>
          <Surface className="overflow-hidden">
            <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("publicPage:logoTitle")}</h2></header>
            <div className="flex flex-wrap items-center gap-3 p-4">
              {draft.logoDataUri ? <img src={draft.logoDataUri} alt={t("publicPage:logoAlt")} className="size-14 rounded-lg object-contain" /> : <span className="flex size-14 items-center justify-center rounded-lg border border-[var(--borde)] text-[13px] font-semibold text-[var(--t2)]">{draft.name.slice(0, 2).toUpperCase()}</span>}
              <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-[8px] border border-[var(--borde)] px-3 text-[13px] text-[var(--t1)] hover:bg-[var(--s2)]">
                <ImagePlus aria-hidden="true" className="size-4" />{t("publicPage:uploadLogo")}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void chooseLogo(event.target.files?.[0]); }} />
              </label>
              {draft.logoDataUri ? <Button type="button" variant="ghost" onClick={() => setDraftState({ ...draft, logoDataUri: null, uploadedLogoBase64: null, logoContentType: null, removeLogo: true })}>{t("publicPage:removeLogo")}</Button> : null}
            </div>
          </Surface>
          <Surface className="overflow-hidden">
            <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]"><h2>{t("publicPage:contactTitle")}</h2></header>
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
              <FormField label={t("publicPage:fields.email")}><Input type="email" value={draft.contactEmail} maxLength={254} onChange={(event) => setDraftState({ ...draft, contactEmail: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.phone")}><Input type="tel" value={draft.contactPhone} maxLength={100} onChange={(event) => setDraftState({ ...draft, contactPhone: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.address")}><Input value={draft.address} maxLength={500} onChange={(event) => setDraftState({ ...draft, address: event.target.value })} /></FormField>
              <FormField label={t("publicPage:fields.website")}><Input type="url" value={draft.website} maxLength={2048} onChange={(event) => setDraftState({ ...draft, website: event.target.value })} /></FormField>
            </div>
          </Surface>
        </> : null}
      </div>
    </Page>

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="md:max-w-[600px]">
        <DialogHeader><DialogTitle>{t("publicPage:preview")}</DialogTitle><DialogDescription>{t("publicPage:previewDescription")}</DialogDescription></DialogHeader>
        {draft ? <div className="flex flex-col gap-4 px-5 pb-5">
          <div className="flex items-center gap-3">{draft.logoDataUri ? <img src={draft.logoDataUri} alt={t("publicPage:logoAlt")} className="size-12 rounded-lg object-contain" /> : null}<h2 className="text-lg font-bold text-[var(--t1)]">{draft.name}</h2></div>
          {draft.description ? <p className="whitespace-pre-wrap text-[13px] text-[var(--t2)]">{draft.description}</p> : null}
          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            {draft.contactEmail ? <div><dt className="font-semibold">{t("publicPage:fields.email")}</dt><dd>{draft.contactEmail}</dd></div> : null}
            {draft.contactPhone ? <div><dt className="font-semibold">{t("publicPage:fields.phone")}</dt><dd>{draft.contactPhone}</dd></div> : null}
            {draft.address ? <div><dt className="font-semibold">{t("publicPage:fields.address")}</dt><dd>{draft.address}</dd></div> : null}
            {draft.website ? <div><dt className="font-semibold">{t("publicPage:fields.website")}</dt><dd>{draft.website}</dd></div> : null}
          </dl>
        </div> : null}
        <DialogFooter><Button type="button" onClick={() => setPreviewOpen(false)}>{t("common:actions.close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={blockedInfoOpen} onOpenChange={setBlockedInfoOpen}>
      <DialogContent className="md:max-w-[480px]">
        <DialogHeader><DialogTitle>{t("publicPage:blockedTitle")}</DialogTitle><DialogDescription>{t("publicPage:blockedReason", { reason: pageData?.publishBlockedReason ?? t("publicPage:blockedFallback") })}</DialogDescription></DialogHeader>
        <ol className="list-decimal space-y-1 px-10 pb-4 text-[13px] text-[var(--t2)]"><li>{t("publicPage:blockedStep1")}</li><li>{t("publicPage:blockedStep2")}</li></ol>
        <DialogFooter><Button type="button" onClick={() => setBlockedInfoOpen(false)}>{t("common:actions.close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} title={t("publicPage:unpublishTitle")} description={t("publicPage:unpublishDescription")} confirmLabel={t("publicPage:unpublish")} destructive onConfirm={() => publication.mutate(false)} />
  </>;
}
