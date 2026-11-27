import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { actionErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Input } from "@/shared/ui/input";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { PageLoading } from "@/shared/ui/PageLoading";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Textarea } from "@/shared/ui/textarea";
import { homeOf } from "@/tenancy/access";
import { catalogsQueryRoot, createCatalog } from "../api/catalogs";
import type { CreateFormCatalogRequest } from "../api/types";
import { CatalogConflictDialog } from "../components/catalog/CatalogConflictDialog";
import { CatalogOriginFields, type CatalogOrigin } from "../components/catalog/CatalogOriginFields";
import { CatalogPreviewPhone } from "../components/catalog/CatalogPreviewPhone";
import { ImportDialog } from "../components/catalog/ImportDialog";
import { OptionsSection } from "../components/catalog/OptionsSection";
import { catalogFieldErrors, isCatalogConflict } from "../errors";
import { useCatalogEditor, type CatalogEditor } from "../hooks/useCatalogEditor";
import { catalogStatus } from "../lib/catalogStatus";
import { catalogsPath } from "../registration";

/**
 * El editor de un catálogo (FRM-Catalogo y M-FRM-Catalogo), nuevo (`/nuevo`, donde «Crear catálogo» manda el `POST`) o
 * guardado (`/:id`). «El catálogo» dice de dónde salen y el tipo, con el nombre y la descripción; al costado, «Así lo ve
 * quien lo recibe». La banda trae «Descartar» y «Guardar cambios», y un ⋮ con «Dar de baja» o «Reactivar» (209). Todo se
 * guarda junto en un `PUT`, con su versión (C3); si otra persona guardó, la revisión lado a lado (138).
 */
export function CatalogEditorPage() {
  const { id } = useParams();
  return id ? <SavedCatalogEditor key={id} id={id} /> : <NewCatalogEditor />;
}

const back = (t: (key: string) => string) => ({ to: catalogsPath, label: t("forms:catalog.backToList") });

function previewOptions(editor: CatalogEditor) {
  return editor.rows.filter((row) => row.draft.isActive && !row.pendingDelete && row.draft.text.trim())
    .map((row) => ({ key: row.key, text: row.draft.text, detail: row.draft.detail || null }));
}

/** Al costado en la compu; en el teléfono, un diálogo desde la barra (M-FRM-Catalogo, «Así lo ve quien lo recibe»). */
function PreviewAside({ editor }: { editor: CatalogEditor }) {
  const { t } = useTranslation("forms");
  return <section aria-label={t("forms:catalog.preview.title")} className="flex flex-col gap-2.5 rounded-lg border border-[var(--borde)] bg-white p-4">
    <h2 className="text-[0.875rem] font-semibold">{t("forms:catalog.preview.title")}</h2>
    <CatalogPreviewPhone options={previewOptions(editor)} />
  </section>;
}

function PhonePreviewDialog({ editor, open, onOpenChange }: { editor: CatalogEditor; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("forms");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{t("forms:catalog.preview.title")}</DialogTitle></DialogHeader>
      <DialogBody><CatalogPreviewPhone options={previewOptions(editor)} /></DialogBody>
    </DialogContent>
  </Dialog>;
}

function SavedCatalogEditor({ id }: { id: string }) {
  const { t } = useTranslation(["forms", "common", "errors"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const editor = useCatalogEditor(id);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { saved } = editor;
  const conflictError = isCatalogConflict(editor.saveError);
  const edit = useEditPage({
    isDirty: editor.isDirty,
    error: conflictError ? undefined : editor.saveError ?? editor.setCatalogActive.error,
    onSeeNew: () => { void editor.seeNew(); },
    onContinueEditing: editor.continueEditing,
    // Un error de un campo va debajo de lo que lo causó; el resto, en la franja.
    errorMessage: (error) => catalogFieldErrors(error).length ? null : actionErrorMessage(error, t),
  });

  if (editor.catalog.isPending) return <PageLoading />;
  if (editor.catalog.isError || !saved) {
    return isNotFoundError(editor.catalog.error)
      ? <NotFoundPage homePath={homeOf("business")} screen={t("forms:catalog.screen")} back={back(t)} />
      : <LoadErrorPage onRetry={() => { void editor.catalog.refetch(); }} screen={t("forms:catalog.screen")} back={back(t)} />;
  }

  const status = catalogStatus(saved);
  const editable = saved.canManage && saved.isActive;
  const manual = saved.source === "Manual";
  const statusText = format.formatEnum("FormCatalogStatus", status);
  const unusable = status === "Unusable" && saved.unusableReason ? format.formatEnum("FormCatalogUnusableReason", saved.unusableReason) : undefined;
  const save = async () => {
    // Guardar conserva el lugar (F7 del traspaso 15, 160): ni la página ni la búsqueda ni el desplazamiento cambian.
    if (await editor.save()) toast.success(t("forms:catalog.saved"));
  };
  const activeCount = saved.itemCounts.active
    + editor.rows.filter((row) => row.isNew && row.draft.isActive).length
    - editor.rows.filter((row) => !row.isNew && row.pendingDelete && row.draft.isActive).length;

  return <>
    <Page banner={edit.banner}
      title={saved.name}
      backTo={back(t)}
      status={<span className="inline-flex items-center gap-1">{statusText}{unusable ? <InfoTip text={unusable} title={statusText} /> : null}</span>}
      barAction={phone && manual ? { label: t("forms:catalog.preview.title"), onClick: () => setPreviewOpen(true) } : undefined}
      actions={editable ? <>
        <Button type="button" variant="outline" disabled={!editor.isDirty || editor.saving} onClick={editor.discard}>{t("forms:catalog.discard")}</Button>
        <Button type="button" disabled={!editor.isDirty} pending={editor.saving} pendingLabel={t("common:states.saving")} onClick={() => { void save(); }}>{t("forms:catalog.save")}</Button>
      </> : undefined}
      moreActions={saved.canManage ? { label: t("forms:catalog.actions.catalogMore", { name: saved.name }), pending: editor.setCatalogActive.isPending, items: [
        saved.isActive
          ? { label: t("forms:catalog.actions.deactivate"), icon: Ban, destructive: true, onSelect: () => setConfirmDeactivate(true) }
          : { label: t("forms:catalog.actions.reactivateCatalog"), icon: RotateCcw, onSelect: () => { editor.setCatalogActive.mutate(true, { onSuccess: () => { toast.success(t("forms:catalog.reactivated")); } }); } },
      ] } : undefined}
    >
      {edit.formError}
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Section title={t("forms:catalog.section")} phone="untitled">
          <SectionFields className="grid gap-3.5">
            <p className="text-[0.8125rem] text-[var(--t2)]">{`${format.formatEnum("FormCatalogSource", saved.source)} · ${format.formatEnum("FormCatalogValueType", saved.valueType)}`}</p>
            {editable ? <>
              <FormField label={t("forms:catalog.fields.name")} required error={editor.nameError}>
                <Input value={editor.name} onChange={(event) => editor.setName(event.target.value)} autoComplete="off" />
              </FormField>
              <FormField label={t("forms:catalog.fields.description")}>
                <Textarea value={editor.description} placeholder={t("forms:catalog.optional")} onChange={(event) => editor.setDescription(event.target.value)} />
              </FormField>
            </> : <>
              <ReadOnlyField label={t("forms:catalog.fields.name")}>{saved.name}</ReadOnlyField>
              <ReadOnlyField long label={t("forms:catalog.fields.description")} muted={!saved.description}>{saved.description || t("forms:catalog.optional")}</ReadOnlyField>
            </>}
          </SectionFields>
        </Section>
        {manual && !phone ? <PreviewAside editor={editor} /> : null}
      </div>
      {manual ? <OptionsSection editor={editor} editable={editable} isNew={false} onImport={() => setImporting(true)} /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog editor={editor} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
    {importing ? <ImportDialog catalog={saved} onClose={() => setImporting(false)} onCatalogChanged={() => { void editor.seeNew(); }} /> : null}
    <CatalogConflictDialog conflict={editor.conflict} name={editor.name} rows={editor.rows} total={editor.total} active={activeCount}
      onContinue={editor.continueEditing} onSeeNew={() => { void editor.seeNew(); }} />
    <ConfirmDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}
      title={t("forms:catalog.deactivateDialog.title", { name: saved.name })} description={t("forms:catalog.deactivateDialog.description")}
      confirmLabel={t("forms:catalog.actions.deactivate")} pending={editor.setCatalogActive.isPending} pendingLabel={t("forms:catalog.deactivating")}
      onConfirm={() => editor.setCatalogActive.mutate(false, {
        onSuccess: () => { toast.success(t("forms:catalog.deactivated")); },
        onSettled: () => setConfirmDeactivate(false),
      })} />
  </>;
}

function NewCatalogEditor() {
  const { t } = useTranslation(["forms", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { phone } = useAppChrome();
  const [origin, setOrigin] = useState<CatalogOrigin>({ source: "Manual", valueType: "Text" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const editor = useCatalogEditor(undefined, origin.valueType);
  // Una sola clave por intento: un reintento del mismo pedido no crea otro catálogo (idempotencia).
  const idempotencyKey = useRef<string | null>(null);
  const create = useMutation({ mutationFn: (request: CreateFormCatalogRequest) => createCatalog(request, idempotencyKey.current ??= crypto.randomUUID()) });
  const edit = useEditPage({
    isDirty: editor.name.trim() !== "" || editor.description.trim() !== "" || editor.rows.length > 0,
    error: editor.saveError,
    onSeeNew: () => undefined,
    onContinueEditing: () => undefined,
    errorMessage: (error) => catalogFieldErrors(error).length ? null : actionErrorMessage(error, t),
  });
  const manual = origin.source === "Manual";

  function submit() {
    if (!editor.name.trim()) {
      editor.setNameError(t("forms:catalog.errors.nameRequired"));
      return;
    }
    const items = manual ? editor.createItems() : [];
    if (!items) return;
    create.mutate({ name: editor.name, description: editor.description.trim() || null, source: origin.source, valueType: origin.valueType, items }, {
      onSuccess: (result) => {
        idempotencyKey.current = null;
        toast.success(t("forms:catalog.saved"));
        void queryClient.invalidateQueries({ queryKey: catalogsQueryRoot });
        edit.allowNextNavigation();
        void navigate(`${catalogsPath}/${result.catalog.id}`, { replace: true });
      },
      onError: editor.rejected,
    });
  }

  return <>
    <Page title={t("forms:catalogs.new")} backTo={back(t)} banner={edit.banner}
      barAction={phone && manual ? { label: t("forms:catalog.preview.title"), onClick: () => setPreviewOpen(true) } : undefined}
      actions={<>
        <Button type="button" variant="outline" onClick={() => { void navigate(catalogsPath); }}>{t("common:actions.cancel")}</Button>
        <Button type="button" pending={create.isPending} pendingLabel={t("forms:catalog.creating")} onClick={submit}>{t("forms:catalog.create")}</Button>
      </>}
    >
      {edit.formError}
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Section title={t("forms:catalog.section")} phone="untitled">
          <SectionFields className="grid gap-3.5">
            <CatalogOriginFields value={origin} onChange={setOrigin} />
            <FormField label={t("forms:catalog.fields.newName")} required error={editor.nameError}>
              <Input value={editor.name} onChange={(event) => editor.setName(event.target.value)} autoComplete="off" />
            </FormField>
            <FormField label={t("forms:catalog.fields.description")}>
              <Textarea value={editor.description} placeholder={t("forms:catalog.optional")} onChange={(event) => editor.setDescription(event.target.value)} />
            </FormField>
          </SectionFields>
        </Section>
        {manual && !phone ? <PreviewAside editor={editor} /> : null}
      </div>
      {manual ? <OptionsSection editor={editor} editable isNew /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog editor={editor} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
  </>;
}
