import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { actionErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { AssistantProposalChangesSection, AssistantProposalMark } from "@/shared/assistant-actions";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { AppIconButton } from "@/shared/ui/app/AppBar";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { FormField } from "@/shared/ui/FormField";
import { EyeIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Spinner } from "@/shared/ui/Spinner";
import { Textarea } from "@/shared/ui/textarea";
import { homeOf } from "@/tenancy/access";
import { catalogsQueryRoot, createCatalog } from "../api/catalogs";
import type { CreateFormCatalogRequest, FormCatalogPresentationIssues, FormCatalogRow } from "../api/types";
import { CatalogBandStatus } from "../components/catalog/CatalogCells";
import { CatalogConflictDialog } from "../components/catalog/CatalogConflictDialog";
import { CatalogOriginFields, type CatalogOrigin } from "../components/catalog/CatalogOriginFields";
import { CatalogPreviewPhone, PreviewOptionsCard, type PreviewOption } from "../components/catalog/CatalogPreviewPhone";
import { FiltersEditor } from "../components/catalog/FiltersEditor";
import { FiltersPreview } from "../components/catalog/FiltersPreview";
import { ImportDialog } from "../components/catalog/ImportDialog";
import { OptionsSection } from "../components/catalog/OptionsSection";
import { PresentationEditor } from "../components/catalog/PresentationEditor";
import { catalogFieldErrors, isCatalogConflict } from "../errors";
import { useCatalogEditor, type CatalogEditor, type CatalogSaveExtra } from "../hooks/useCatalogEditor";
import { useCatalogFieldSources } from "../hooks/useCatalogFieldSources";
import { useCatalogFilters, type CatalogFilters } from "../hooks/useCatalogFilters";
import { useCatalogProposal, useCatalogProposalTargets } from "../hooks/useCatalogProposal";
import { useOptionsActions } from "../hooks/useOptionsActions";
import { catalogLimits } from "../lib/catalogLimits";
import { draftPlaceText, presentedOption, type PresentationSource } from "../lib/catalogPresentation";
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

/** Un rechazo que se ve debajo de lo que lo causó (un dato, una opción, un campo o «En WhatsApp»); el tope de campos, en la franja. */
const shownInPlace = (error: unknown) => catalogFieldErrors(error).some((item) => item.field !== "fields");

const noIssues: FormCatalogPresentationIssues = { count: 0, examples: [] };

/**
 * Lo que ve quien lo recibe, armado con «En WhatsApp» (E13): el título y la descripción de cada opción activa del borrador, como
 * los arma el servidor, con lo que no entra marcado; y lo que dice cada lugar en la primera, para «Por ejemplo».
 */
function useCatalogPresentationView(editor: CatalogEditor) {
  const format = useFormat();
  const sourceItem = useCatalogFieldSources(editor.saved?.fields ?? [], editor.rows);
  const source: PresentationSource = { valueType: editor.valueType, fields: editor.presentationFields, sourceItem };
  const shown = editor.rows.filter((row) => row.draft.isActive && !row.pendingDelete);
  const options: PreviewOption[] = shown.filter((row) => row.draft.text.trim())
    .map((row) => presentedOption(row.key, editor.presentation, draftPlaceText(row.draft, source, format)));
  const first = shown[0];
  return { options, example: first ? draftPlaceText(first.draft, source, format) : null };
}

/** «En WhatsApp», debajo de «El catálogo» en uno a mano (FRM-Catalogo-13): en solo lectura, apagado. */
function CatalogPresentation({ editor, editable, issues, example }: {
  editor: CatalogEditor; editable: boolean; issues: FormCatalogPresentationIssues; example: ReturnType<typeof useCatalogPresentationView>["example"];
}) {
  return <PresentationEditor value={editor.presentation} onChange={editor.setPresentation} valueType={editor.valueType} fields={editor.presentationFields}
    example={example} issues={issues} editable={editable} error={editor.presentationError} />;
}

/** Al costado en la compu, suelto, sin caja (FRM-Catalogo); en el teléfono, un diálogo desde el ojo de la barra (M-FRM-Catalogo). */
function PreviewAside({ options }: { options: readonly PreviewOption[] }) {
  const { t } = useTranslation("forms");
  return <section aria-label={t("forms:catalog.preview.title")} className="flex flex-col gap-2.5">
    <h2 className="text-[0.9375rem] font-semibold">{t("forms:catalog.preview.title")}</h2>
    <CatalogPreviewPhone options={options} />
  </section>;
}

/** En el teléfono, «Así lo ve quien lo recibe» se abre desde el ojo de la barra: la lista de opciones en una tarjeta, sin el
 * marco del teléfono (M-FRM-Catalogo); con filtros, con la persona o el cliente de ejemplo arriba (M-FRM-Catalogo-Filtros y
 * M-FRM-Catalogo-Contactos). */
function PhonePreviewDialog({ options, filters, open, onOpenChange }: { options: readonly PreviewOption[]; filters: CatalogFilters; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("forms");
  // Se abre desde la barra, no desde un DialogTrigger: al cerrar, el foco vuelve a ese botón (formularios).
  const restoreFocus = useRestoreFocusOnClose(open);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("forms:catalog.preview.title")}</DialogTitle></DialogHeader>
      <DialogBody>{filters.filtered ? <FiltersPreview filters={filters} bare /> : <PreviewOptionsCard options={options} />}</DialogBody>
    </DialogContent>
  </Dialog>;
}

/** «El catálogo» arriba y, con filtros, «Qué miembros entran» o «Qué contactos entran» debajo; la vista previa, al costado. */
/** En el teléfono, «Así lo ve quien lo recibe» es el ojo de la barra, junto al ⋮ (M-FRM-Catalogo): el título entra entero. */
function PreviewBarButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation("forms");
  return <AppBarTools><AppIconButton label={t("forms:catalog.preview.title")} onClick={onOpen}><EyeIcon /></AppIconButton></AppBarTools>;
}

/** El nombre que ya trajo el listado, si se llegó desde ahí: la banda lo muestra mientras carga la ficha. */
function listedName(queryClient: QueryClient, id: string): string | undefined {
  for (const [, page] of queryClient.getQueriesData<{ items?: readonly FormCatalogRow[] }>({ queryKey: [...catalogsQueryRoot, "list"] })) {
    const row = page?.items?.find((item) => item.id === id);
    if (row) return row.name;
  }
  return undefined;
}

/** Mientras carga la ficha (FRM-Catalogo, «Cargando»): la banda con ‹ y el título, y abajo una zona con el aro. */
function CatalogLoading({ id }: { id: string }) {
  const { t } = useTranslation("forms");
  const queryClient = useQueryClient();
  return <Page title={listedName(queryClient, id) ?? t("forms:catalog.screen")} backTo={back(t)}>
    <div data-slot="catalog-loading" className="flex min-h-40 items-center justify-center border-b border-[var(--borde)]"><Spinner /></div>
  </Page>;
}

/** «El catálogo» arriba y, debajo, «En WhatsApp» (a mano) o los filtros; la vista previa, al costado de los dos (FRM-Catalogo-13). */
function CatalogColumns({ phone, options, filters, editable, below, children }: {
  phone: boolean; options: readonly PreviewOption[]; filters: CatalogFilters; editable: boolean; below?: ReactNode; children: ReactNode;
}) {
  return <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_20rem]">
    {filters.filtered ? <div className="flex min-w-0 flex-col gap-3.5">{children}<FiltersEditor filters={filters} editable={editable} /></div>
      : below ? <div className="flex min-w-0 flex-col gap-3.5">{children}{below}</div> : children}
    {phone ? null : filters.filtered ? <FiltersPreview filters={filters} /> : <PreviewAside options={options} />}
  </div>;
}

function SavedCatalogEditor({ id }: { id: string }) {
  const { t } = useTranslation(["forms", "common", "errors"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  // La propuesta del asistente va antes del editor: las opciones guardadas que toca llegan al borrador por su consulta.
  const targets = useCatalogProposalTargets(id);
  const editor = useCatalogEditor(id, { extraRows: targets.rows });
  // Las migas terminan en el nombre del catálogo, como en Rol y Usuario.
  useBreadcrumbLeaf(editor.saved?.name);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { saved } = editor;
  const filters = useCatalogFilters({ source: saved?.source ?? "Manual", saved, canManage: saved?.canManage ?? false, error: editor.saveError,
    sampleRequiredMessage: t("forms:catalog.errors.sampleRequired") });
  const editableNow = Boolean(saved?.canManage && saved.isActive);
  const optionsActions = useOptionsActions(editor, { editable: editableNow, isNew: false });
  const proposal = useCatalogProposal(editor, targets);
  const presentationView = useCatalogPresentationView(editor);
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
    errorMessage: (error) => shownInPlace(error) ? null : actionErrorMessage(error, t),
  });

  if (editor.catalog.isPending) return <CatalogLoading id={id} />;
  // Solo sin nada que mostrar: si falla una relectura, la ficha sigue a la vista (errores).
  if (!saved) {
    return isNotFoundError(editor.catalog.error)
      ? <NotFoundPage homePath={homeOf("business")} screen={t("forms:catalog.screen")} back={back(t)} />
      : <LoadErrorPage onRetry={() => { void editor.catalog.refetch(); }} screen={t("forms:catalog.screen")} back={back(t)} />;
  }

  const editable = saved.canManage && saved.isActive;
  const manual = saved.source === "Manual";
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
  // El ⋮ de la banda: «Dar de baja» o «Reactivar», una opción común (el rojo va en su confirmación, FRM-Catalogo). En el
  // teléfono suma, antes, lo de «Opciones»: «Exportar», la plantilla, «Ordenar por…» y los códigos (M-FRM-Catalogo).
  const statusItem = saved.isActive
    ? { label: t(phone ? "forms:catalog.actions.deactivateCatalog" : "forms:catalog.actions.deactivate"), icon: Ban, onSelect: () => setConfirmDeactivate(true) }
    : { label: t("forms:catalog.actions.reactivateCatalog"), icon: RotateCcw, onSelect: () => { setActive(true); } };
  const bandItems = [...(phone && manual ? optionsActions.bandItems : []), ...(saved.canManage ? [statusItem] : [])];
  const activeCount = saved.itemCounts.active
    + editor.rows.filter((row) => row.isNew && row.draft.isActive).length
    - editor.rows.filter((row) => !row.isNew && row.pendingDelete && row.draft.isActive).length;

  return <>
    <Page banner={edit.banner}
      title={saved.name}
      titleAside={proposal.proposing ? <AssistantProposalMark /> : undefined}
      backTo={back(t)}
      status={<CatalogBandStatus catalog={saved} phone={phone} />}
      actions={editable ? <>
        <Button type="button" variant="outline" onClick={discard}>{t("forms:catalog.discard")}</Button>
        <Button type="button" disabled={!isDirty} pending={editor.saving} pendingLabel={t("common:states.saving")} onClick={save}>{t("forms:catalog.save")}</Button>
      </> : undefined}
      moreActions={bandItems.length ? { label: t("forms:catalog.actions.catalogMore", { name: saved.name }), pending: editor.activating, items: bandItems } : undefined}
    >
      {phone ? <PreviewBarButton onOpen={() => setPreviewOpen(true)} /> : null}
      {edit.formError}
      {/* FRM-Catalogo-Opciones-Propuesta: si el catálogo cambió desde la propuesta, lo dice arriba; «Lo que cambia», arriba de
          todo, ya va sobre lo de ahora. */}
      {proposal.changedSince ? <Banner tone="warning">{t("forms:catalog.proposal.changedSince", { name: saved.name })}</Banner> : null}
      {proposal.changeRows.length ? <AssistantProposalChangesSection rows={proposal.changeRows} /> : null}
      <CatalogColumns phone={phone} options={presentationView.options} filters={filters} editable={editable}
        below={manual ? <CatalogPresentation editor={editor} editable={editable} issues={saved.presentationIssues ?? noIssues} example={presentationView.example} /> : undefined}>
        <Section title={t("forms:catalog.section")} phone="loose">
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
      {manual ? <OptionsSection editor={editor} editable={editable} isNew={false} actions={optionsActions} onImport={() => setImporting(true)} rowReview={proposal.rowReview} /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog options={presentationView.options} filters={filters} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
    {importing ? <ImportDialog catalog={saved} onClose={() => setImporting(false)} onCatalogChanged={() => { void editor.seeNew(); }} /> : null}
    <CatalogConflictDialog conflict={editor.conflict} name={editor.name} rows={editor.rows} total={editor.total} active={activeCount}
      valueType={editor.valueType} savedRow={editor.savedRow} fields={editor.fields.fields} onContinue={editor.continueEditing} onSeeNew={() => { void seeNew(); }} />
    <ConfirmDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}
      title={t("forms:catalog.deactivateDialog.title", { name: saved.name })} description={t("forms:catalog.deactivateDialog.description")}
      confirmLabel={t("forms:catalog.actions.deactivate")} destructive pending={editor.activating} pendingLabel={t("forms:catalog.deactivating")}
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
  const optionsActions = useOptionsActions(editor, { editable: true, isNew: true });
  const filters = useCatalogFilters({ source: origin.source, canManage: true, error: editor.saveError, sampleRequiredMessage: t("forms:catalog.errors.sampleRequired") });
  const presentationView = useCatalogPresentationView(editor);
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
    isDirty: editor.name.trim() !== "" || editor.description.trim() !== "" || editor.rows.length > 0 || filters.draft.conditions.length > 0
      || editor.fieldsDirty || editor.presentationDirty,
    error: editor.saveError,
    onSeeNew: () => undefined,
    onContinueEditing: () => undefined,
    errorMessage: (error) => shownInPlace(error) ? null : actionErrorMessage(error, t),
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
    // Uno a mano lleva también sus campos y «En WhatsApp», si se eligieron (E13).
    create.mutate({ name: editor.name, description: editor.description.trim() || null, source: origin.source, valueType: origin.valueType, items,
      ...(manual ? editor.fieldsRequest() : filters.request()) }, {
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
      actions={<>
        <Button type="button" variant="outline" onClick={() => { void navigate(catalogsPath); }}>{t("common:actions.cancel")}</Button>
        <Button type="button" pending={create.isPending} pendingLabel={t("forms:catalog.creating")} onClick={submit}>{t("forms:catalog.create")}</Button>
      </>}
    >
      {phone ? <PreviewBarButton onOpen={() => setPreviewOpen(true)} /> : null}
      {edit.formError}
      <CatalogColumns phone={phone} options={presentationView.options} filters={filters} editable
        below={manual ? <CatalogPresentation editor={editor} editable issues={noIssues} example={presentationView.example} /> : undefined}>
        <Section title={t("forms:catalog.section")} phone="loose">
          <SectionFields className="grid gap-3.5">
            <CatalogOriginFields value={origin} onChange={changeOrigin} />
            {/* «Nombre», como en la ficha guardada; «Nombre del catálogo» es el texto de ejemplo del campo (FRM-Catalogo). */}
            <FormField label={t("forms:catalog.fields.name")} required error={editor.nameError}>
              <Input value={editor.name} maxLength={catalogLimits.name} placeholder={t("forms:catalog.fields.newName")} onChange={(event) => editor.setName(event.target.value)} autoComplete="off" />
            </FormField>
            <FormField label={t("forms:catalog.fields.description")}>
              <Textarea value={editor.description} maxLength={catalogLimits.description} onChange={(event) => editor.setDescription(event.target.value)} />
            </FormField>
          </SectionFields>
        </Section>
      </CatalogColumns>
      {manual ? <OptionsSection editor={editor} editable isNew actions={optionsActions} /> : null}
    </Page>
    {edit.leaveDialog}
    {phone ? <PhonePreviewDialog options={presentationView.options} filters={filters} open={previewOpen} onOpenChange={setPreviewOpen} /> : null}
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
