import { useQueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { actionErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { AssistantProposalChangesSection, AssistantProposalMark } from "@/shared/assistant-actions";
import { useFormat } from "@/shared/format/useFormat";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
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
import { FiltersEditor } from "../components/catalog/FiltersEditor";
import { FiltersPreview } from "../components/catalog/FiltersPreview";
import { ImportDialog } from "../components/catalog/ImportDialog";
import { OptionsSection } from "../components/catalog/OptionsSection";
import { catalogFieldErrors, isCatalogConflict } from "../errors";
import { useCatalogEditor, type CatalogEditor, type CatalogSaveExtra } from "../hooks/useCatalogEditor";
import { useCatalogFilters, type CatalogFilters } from "../hooks/useCatalogFilters";
import { useCatalogProposal, useCatalogProposalTargets } from "../hooks/useCatalogProposal";
import { catalogLimits } from "../lib/catalogLimits";
import { catalogStatus } from "../lib/catalogStatus";
import { catalogsPath } from "../registration";

/**
 * El editor de un catálogo (FRM-Catalogo y M-FRM-Catalogo), nuevo (`/nuevo`, donde «Crear catálogo» manda el `POST`) o
 * guardado (`/:id`). «El catálogo» dice de dónde salen y el tipo, con el nombre y la descripción; al costado, «Así lo ve
 * quien lo recibe». La banda trae «Descartar» y «Guardar cambios», y un ⋮ con «Dar de baja» o «Reactivar» (209). Todo se
 * guarda junto en un `PUT`, con su versión (C3); si otra persona guardó, la revisión lado a lado (138). Con `?proposal=<id>`,
 * lo que propone el asistente para las opciones, cargado y sin guardar (FRM-Catalogo-Opciones-Propuesta y su M-).
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
  return <section aria-label={t("forms:catalog.preview.title")} className="flex flex-col gap-2.5 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-4">
    <h2 className="text-[0.875rem] font-semibold">{t("forms:catalog.preview.title")}</h2>
    <CatalogPreviewPhone options={previewOptions(editor)} />
  </section>;
}

/** En el teléfono, «Así lo ve quien lo recibe» se abre desde la barra: a mano, con «Una opción | Varias»; con filtros, con la
 * persona o el cliente de ejemplo arriba (M-FRM-Catalogo-Filtros y M-FRM-Catalogo-Contactos). */
function PhonePreviewDialog({ editor, filters, open, onOpenChange }: { editor: CatalogEditor; filters: CatalogFilters; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("forms");
  // Se abre desde la barra, no desde un DialogTrigger: al cerrar, el foco vuelve a ese botón (formularios).
  const restoreFocus = useRestoreFocusOnClose(open);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("forms:catalog.preview.title")}</DialogTitle></DialogHeader>
      <DialogBody>{filters.filtered ? <FiltersPreview filters={filters} bare /> : <CatalogPreviewPhone options={previewOptions(editor)} />}</DialogBody>
    </DialogContent>
  </Dialog>;
}

/** «El catálogo» arriba y, con filtros, «Qué miembros entran» o «Qué contactos entran» debajo; la vista previa, al costado. */
function CatalogColumns({ phone, editor, filters, editable, children }: { phone: boolean; editor: CatalogEditor; filters: CatalogFilters; editable: boolean; children: ReactNode }) {
  return <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_20rem]">
    {filters.filtered ? <div className="flex min-w-0 flex-col gap-3.5">{children}<FiltersEditor filters={filters} editable={editable} /></div> : children}
    {phone ? null : filters.filtered ? <FiltersPreview filters={filters} /> : <PreviewAside editor={editor} />}
  </div>;
}

function SavedCatalogEditor({ id }: { id: string }) {
  const { t } = useTranslation(["forms", "common", "errors"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  // La propuesta del asistente va antes del editor: las opciones guardadas que toca llegan al borrador por su consulta.
  const targets = useCatalogProposalTargets(id);
  const editor = useCatalogEditor(id, { extraRows: targets.rows });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { saved } = editor;
  const filters = useCatalogFilters({ source: saved?.source ?? "Manual", saved, canManage: saved?.canManage ?? false, error: editor.saveError,
    sampleRequiredMessage: t("forms:catalog.errors.sampleRequired") });
  const editableNow = Boolean(saved?.canManage && saved.isActive);
  const proposal = useCatalogProposal(editor, targets);
  const isDirty = editor.isDirty || (editableNow && filters.isDirty);
  // El 409 se lee en la revisión lado a lado; si lo guardado ahora no se pudo leer, en el cartel de siempre.
  const conflictInDialog = isCatalogConflict(editor.saveError) && !editor.conflictUnreadable;
  const seeNew = async () => { const fresh = await editor.seeNew(); filters.reset(fresh); };
  // «Descartar» vuelve a lo guardado; también descarta la propuesta.
  const discard = () => { editor.discard(); filters.reset(); proposal.drop?.(); };
  const edit = useEditPage({
    isDirty,
    error: conflictInDialog ? undefined : editor.saveError,
    onSeeNew: () => { void seeNew(); },
    onContinueEditing: editor.continueEditing,
    // Un error de un campo va debajo de lo que lo causó; el resto, en la franja.
    errorMessage: (error) => catalogFieldErrors(error).length ? null : actionErrorMessage(error, t),
  });

  if (editor.catalog.isPending) return <PageLoading />;
  // Solo sin nada que mostrar: si falla una relectura, la ficha sigue a la vista (errores).
  if (!saved) {
    return isNotFoundError(editor.catalog.error)
      ? <NotFoundPage homePath={homeOf("business")} screen={t("forms:catalog.screen")} back={back(t)} />
      : <LoadErrorPage onRetry={() => { void editor.catalog.refetch(); }} screen={t("forms:catalog.screen")} back={back(t)} />;
  }

  const status = catalogStatus(saved);
  const editable = saved.canManage && saved.isActive;
  const manual = saved.source === "Manual";
  const statusText = format.formatEnum("FormCatalogStatus", status);
  const unusable = status === "Unusable" && saved.unusableReason ? format.formatEnum("FormCatalogUnusableReason", saved.unusableReason) : undefined;
  // Los filtros viajan solo si cambiaron: cambiar el nombre no vuelve a validarlos. `false`: falta la persona de ejemplo.
  const filtersExtra = (): CatalogSaveExtra | undefined | false => {
    const withFilters = filters.isDirty ? filters.request() : null;
    if (!withFilters) return undefined;
    return filters.checkSample() && { request: withFilters, view: filters.savedView() };
  };
  // Con la propuesta, la tarjeta pasa a aplicada con la versión que respondió el guardado.
  const savedWith = (message: string) => {
    const markApplied = proposal.markApplied;
    return (version: number) => {
      toast.success(message);
      if (markApplied) void markApplied(version);
    };
  };
  const save = () => {
    const extra = filtersExtra();
    if (extra === false) return;
    // Guardar conserva el lugar (F7 del traspaso 15, 160): ni la página ni la búsqueda ni el desplazamiento cambian. Lo que
    // sigue al guardado va en su `onSuccess`, así «Reintentar» del aviso termina igual (errores).
    editor.save(extra, savedWith(t("forms:catalog.saved")));
  };
  // «Dar de baja» y «Reactivar» mandan el mismo guardado, con lo pendiente (C3); `false` si no salió.
  const setActive = (isActive: boolean, onSettled?: () => void) => {
    const extra = filtersExtra();
    return extra !== false && editor.setCatalogActive(isActive, extra,
      savedWith(t(isActive ? "forms:catalog.reactivated" : "forms:catalog.deactivated")), onSettled);
  };
  const activeCount = saved.itemCounts.active
    + editor.rows.filter((row) => row.isNew && row.draft.isActive).length
    - editor.rows.filter((row) => !row.isNew && row.pendingDelete && row.draft.isActive).length;

  return <>
    <Page banner={edit.banner}
      title={saved.name}
      titleAside={proposal.proposing ? <AssistantProposalMark /> : undefined}
      backTo={back(t)}
      status={<span className="inline-flex items-center gap-1">{statusText}{unusable ? <InfoTip text={unusable} title={statusText} /> : null}</span>}
      barAction={phone ? { label: t("forms:catalog.preview.title"), onClick: () => setPreviewOpen(true) } : undefined}
      actions={editable ? <>
        <Button type="button" variant="outline" onClick={discard}>{t("forms:catalog.discard")}</Button>
        <Button type="button" disabled={!isDirty} pending={editor.saving} pendingLabel={t("common:states.saving")} onClick={save}>{t("forms:catalog.save")}</Button>
      </> : undefined}
      moreActions={saved.canManage ? { label: t("forms:catalog.actions.catalogMore", { name: saved.name }), pending: editor.activating, items: [
        saved.isActive
          ? { label: t("forms:catalog.actions.deactivate"), icon: Ban, destructive: true, onSelect: () => setConfirmDeactivate(true) }
          : { label: t("forms:catalog.actions.reactivateCatalog"), icon: RotateCcw, onSelect: () => { setActive(true); } },
      ] } : undefined}
    >
      {edit.formError}
      {/* FRM-Catalogo-Opciones-Propuesta: si el catálogo cambió desde la propuesta, lo dice arriba; «Lo que cambia», arriba de
          todo, ya va sobre lo de ahora. */}
      {proposal.changedSince ? <Banner tone="warning" className="max-md:mx-4 max-md:mt-4">{t("forms:catalog.proposal.changedSince", { name: saved.name })}</Banner> : null}
      {proposal.changeRows.length ? <AssistantProposalChangesSection rows={proposal.changeRows} /> : null}
      <CatalogColumns phone={phone} editor={editor} filters={filters} editable={editable}>
        <Section title={t("forms:catalog.section")} phone="untitled">
          <SectionFields className="grid gap-3.5">
            {/* Uno con filtros es siempre de texto: dice solo de dónde salen (FRM-Catalogo-Filtros). */}
            <p className="text-[0.8125rem] text-[var(--t2)]">{manual ? `${format.formatEnum("FormCatalogSource", saved.source)} · ${format.formatEnum("FormCatalogValueType", saved.valueType)}` : format.formatEnum("FormCatalogSource", saved.source)}</p>
            {editable ? <>
              <FormField label={t("forms:catalog.fields.name")} required error={editor.nameError}>
                <Input value={editor.name} maxLength={catalogLimits.name} onChange={(event) => editor.setName(event.target.value)} autoComplete="off" />
              </FormField>
              <FormField label={t("forms:catalog.fields.description")}>
                <Textarea value={editor.description} maxLength={catalogLimits.description} onChange={(event) => editor.setDescription(event.target.value)} />
              </FormField>
            </> : <>
              <ReadOnlyField label={t("forms:catalog.fields.name")}>{saved.name}</ReadOnlyField>
              <ReadOnlyField long label={t("forms:catalog.fields.description")} muted={!saved.description}>{saved.description || <EmptyValue />}</ReadOnlyField>
            </>}
          </SectionFields>
        </Section>
      </CatalogColumns>
      {manual ? <OptionsSection editor={editor} editable={editable} isNew={false} onImport={() => setImporting(true)} rowReview={proposal.rowReview} /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog editor={editor} filters={filters} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
    {importing ? <ImportDialog catalog={saved} onClose={() => setImporting(false)} onCatalogChanged={() => { void editor.seeNew(); }} /> : null}
    <CatalogConflictDialog conflict={editor.conflict} name={editor.name} rows={editor.rows} total={editor.total} active={activeCount}
      valueType={editor.valueType} savedRow={editor.savedRow} onContinue={editor.continueEditing} onSeeNew={() => { void seeNew(); }} />
    <ConfirmDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}
      title={t("forms:catalog.deactivateDialog.title", { name: saved.name })} description={t("forms:catalog.deactivateDialog.description")}
      confirmLabel={t("forms:catalog.actions.deactivate")} pending={editor.activating} pendingLabel={t("forms:catalog.deactivating")}
      onConfirm={() => { if (!setActive(false, () => setConfirmDeactivate(false))) setConfirmDeactivate(false); }} />
  </>;
}

function NewCatalogEditor() {
  const { t } = useTranslation(["forms", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { phone } = useAppChrome();
  const format = useFormat();
  const [origin, setOrigin] = useState<CatalogOrigin>({ source: "Manual", valueType: "Text" });
  const [pendingOrigin, setPendingOrigin] = useState<CatalogOrigin | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editor = useCatalogEditor(undefined, { newValueType: origin.valueType });
  const filters = useCatalogFilters({ source: origin.source, canManage: true, error: editor.saveError, sampleRequiredMessage: t("forms:catalog.errors.sampleRequired") });
  // Ninguna elección se descarta en silencio (162): otro origen o tipo pregunta antes, con lo que se va.
  const lostBy = (next: CatalogOrigin) => ({
    options: origin.source === "Manual" && (next.source !== "Manual" || next.valueType !== origin.valueType) ? editor.rows.length : 0,
    conditions: origin.source !== "Manual" && next.source !== origin.source ? filters.draft.conditions.length : 0,
  });
  const applyOrigin = (next: CatalogOrigin) => {
    if (lostBy(next).options) editor.clearItems();
    setOrigin(next);
    setPendingOrigin(null);
  };
  const changeOrigin = (next: CatalogOrigin) => {
    const lost = lostBy(next);
    if (lost.options || lost.conditions) setPendingOrigin(next);
    else applyOrigin(next);
  };
  const pendingLost = pendingOrigin ? lostBy(pendingOrigin) : null;
  // Una clave por formulario (idempotencia): la red y un 5xx la conservan, así un reintento no crea otro catálogo; un 4xx o
  // un pedido corregido salen con otra (datos-y-api).
  const create = useIdempotentMutation((request: CreateFormCatalogRequest, key: string) => createCatalog(request, key),
    { sameOperation: (previous, next) => JSON.stringify(previous) === JSON.stringify(next) });
  const edit = useEditPage({
    isDirty: editor.name.trim() !== "" || editor.description.trim() !== "" || editor.rows.length > 0 || filters.draft.conditions.length > 0,
    error: editor.saveError,
    onSeeNew: () => undefined,
    onContinueEditing: () => undefined,
    errorMessage: (error) => catalogFieldErrors(error).length ? null : actionErrorMessage(error, t),
  });
  const manual = origin.source === "Manual";

  function submit() {
    const named = Boolean(editor.name.trim());
    if (!named) editor.setNameError(t("forms:catalog.errors.nameRequired"));
    // Sin persona de ejemplo no se crea uno de miembros con condiciones (§10).
    const sampled = manual || filters.checkSample();
    if (!named || !sampled) return;
    const items = manual ? editor.createItems() : [];
    if (!items) return;
    create.mutate({ name: editor.name, description: editor.description.trim() || null, source: origin.source, valueType: origin.valueType, items,
      ...(manual ? {} : filters.request()) }, {
      onSuccess: (result) => {
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
      barAction={phone ? { label: t("forms:catalog.preview.title"), onClick: () => setPreviewOpen(true) } : undefined}
      actions={<>
        <Button type="button" variant="outline" onClick={() => { void navigate(catalogsPath); }}>{t("common:actions.cancel")}</Button>
        <Button type="button" pending={create.isPending} pendingLabel={t("forms:catalog.creating")} onClick={submit}>{t("forms:catalog.create")}</Button>
      </>}
    >
      {edit.formError}
      <CatalogColumns phone={phone} editor={editor} filters={filters} editable>
        <Section title={t("forms:catalog.section")} phone="untitled">
          <SectionFields className="grid gap-3.5">
            <CatalogOriginFields value={origin} onChange={changeOrigin} />
            <FormField label={t("forms:catalog.fields.newName")} required error={editor.nameError}>
              <Input value={editor.name} maxLength={catalogLimits.name} onChange={(event) => editor.setName(event.target.value)} autoComplete="off" />
            </FormField>
            <FormField label={t("forms:catalog.fields.description")}>
              <Textarea value={editor.description} maxLength={catalogLimits.description} onChange={(event) => editor.setDescription(event.target.value)} />
            </FormField>
          </SectionFields>
        </Section>
      </CatalogColumns>
      {manual ? <OptionsSection editor={editor} editable isNew /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog editor={editor} filters={filters} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
    <ConfirmDialog open={pendingOrigin !== null} onOpenChange={(open) => { if (!open) setPendingOrigin(null); }}
      title={pendingOrigin ? t("forms:catalog.originChange.title", { to: pendingOrigin.source !== origin.source
        ? format.formatEnum("FormCatalogSource", pendingOrigin.source) : format.formatEnum("FormCatalogValueType", pendingOrigin.valueType) }) : ""}
      // Se pierden las opciones (desde «A mano») o las condiciones (desde un origen con filtros), nunca las dos.
      description={!pendingLost ? "" : pendingLost.options
        ? t("forms:catalog.originChange.options", { count: pendingLost.options, n: format.formatInteger(pendingLost.options) })
        : t("forms:catalog.originChange.conditions", { count: pendingLost.conditions, n: format.formatInteger(pendingLost.conditions) })}
      confirmLabel={t("forms:catalog.originChange.confirm")} onConfirm={() => { if (pendingOrigin) applyOrigin(pendingOrigin); }} />
  </>;
}
