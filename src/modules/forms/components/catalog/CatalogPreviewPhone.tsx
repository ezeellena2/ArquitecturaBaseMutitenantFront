import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { InfoTip } from "@/shared/ui/InfoTip";
import { loadingBlock } from "@/shared/ui/PageLoading";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import type { FormCatalogPresentationIssue, FormCatalogPreviewResponse } from "../../api/types";
import { catalogLimits } from "../../lib/catalogLimits";

/**
 * Una opción como la ve WhatsApp: en un catálogo a mano, el título y la descripción que arma «En WhatsApp» (E13), y lo que no
 * entra (`buildPresentation`), que se marca en rojo.
 */
export interface PreviewOption {
  readonly key: string;
  readonly text: string;
  readonly detail?: string | null;
  readonly issue?: FormCatalogPresentationIssue | null;
}

/** Hasta cuántas se eligen con «Varias» en la vista previa (FRM-Catalogo, «Vista previa con varias»). */
const multipleMax = 3;

/**
 * El teléfono de la vista previa (FRM-Catalogo y FRM-Catalogo-Filtros, .tel): el marco negro redondeado, la franja de arriba y
 * la hoja blanca con las esquinas de arriba redondas, con su encabezado. Corta lo que no entra, como el tablero.
 */
function PhoneFrame({ header, subtitle, busy, tall = false, children }: {
  header: ReactNode; subtitle?: string; busy?: boolean; tall?: boolean; children: ReactNode;
}) {
  const { t } = useTranslation("forms");
  return <div role="group" aria-label={t("forms:catalog.preview.title")} aria-busy={busy} data-slot="preview-phone"
    className={cn("relative mx-auto flex w-full max-w-[20rem] flex-col overflow-hidden rounded-[2.125rem] border-8 border-[var(--t1)] bg-[var(--telefono-fondo)] text-[0.78125rem]",
      tall ? "h-[26rem]" : "min-h-[14.75rem]")}>
    <div aria-hidden="true" data-slot="preview-phone-band" className="h-[2.125rem] shrink-0" />
    <div className="flex min-h-0 flex-1 flex-col rounded-t-[1rem] bg-[var(--superficie)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--borde)] px-3.5 py-3 text-[0.9375rem] font-semibold">{header}</div>
      {subtitle ? <p className="px-3.5 pt-2 pb-0.5 text-[0.75rem] text-[var(--t2)]">{subtitle}</p> : null}
      {children}
    </div>
  </div>;
}

/**
 * «Así lo ve quien lo recibe» en la compu (FRM-Catalogo): «Una opción | Varias», chico y centrado, y el teléfono. Con una, la
 * pregunta cerrada con «⌄» y, al tocarla, la lista como la dibuja WhatsApp, con «‹ Pregunta»; con varias, «Elegí hasta 3» debajo
 * de «× Formulario» y las casillas en la hoja. «Enviar» va apagado hasta elegir algo. Es una vista previa: los radios y las
 * casillas imitan WhatsApp y no se mandan. El segmentado es la excepción de dos vistas de lo mismo, y los radios, la de las
 * vistas previas (picker-usage.test.ts). El rótulo es «Pregunta»: el catálogo no sabe qué pregunta lo va a usar.
 */
export function CatalogPreviewPhone({ options, withSwitch = true }: { options: readonly PreviewOption[]; withSwitch?: boolean }) {
  const { t } = useTranslation("forms");
  const [multiple, setMultiple] = useState(false);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const question = t("forms:catalog.preview.question");
  const choose = (key: string, checked: boolean) => setChosen((current) => multiple
    ? checked ? [...current.filter((item) => item !== key), key] : current.filter((item) => item !== key)
    : [key]);
  const switchTo = (next: boolean) => { setMultiple(next); setChosen([]); setOpen(false); };
  const picked = chosen.filter((key) => options.some((option) => option.key === key));
  const chosenText = !multiple && picked.length ? options.find((option) => option.key === picked[0])?.text : undefined;
  const list = <ul className="flex min-h-0 flex-col overflow-hidden">
    {options.map((option) => <li key={option.key}>
      <label className="flex items-center gap-2.5 border-b border-[var(--borde)] px-3.5 py-2">
        <span className="min-w-0 flex-1 leading-[1.3]">
          <span className={cn("block break-words", option.issue === "TitleTooLong" && "text-[var(--peligro)]")}>{option.text}</span>
          {option.detail ? <span className={cn("block break-words text-[0.6875rem]", option.issue === "DescriptionTooLong" ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>{option.detail}</span> : null}
        </span>
        {/* Se marcan con el mouse y con el teclado, igual (accesibilidad). */}
        {multiple
          ? <input type="checkbox" className="accent-[var(--ok)]" checked={picked.includes(option.key)} onChange={(event) => choose(option.key, event.target.checked)} />
          : <input type="radio" name="catalog-preview" className="accent-[var(--ok)]" checked={picked.includes(option.key)} onChange={() => choose(option.key, true)} />}
      </label>
    </li>)}
  </ul>;
  // «Enviar», apagado (verde pálido) hasta elegir: el tablero lo dibuja así (.k-env).
  const send = <p aria-disabled={picked.length === 0 || undefined}
    className={cn("mx-3.5 mt-auto mb-3.5 rounded-[0.5rem] py-2 text-center text-[0.78125rem] font-semibold text-[var(--superficie)]",
      picked.length ? "bg-[var(--ok)]" : "bg-[color-mix(in_oklch,var(--ok)_50%,transparent)]")}>{t("forms:catalog.preview.send")}</p>;
  const close = <span aria-hidden="true" className="text-[1.125rem] leading-none font-normal text-[var(--t2)]">{"×"}</span>;
  return <div className="flex flex-col gap-2.5">
    {withSwitch ? <div className="flex justify-center [&>[data-slot=segmented]]:w-40 [&>[data-slot=segmented]]:self-auto">
      <SegmentedControl aria-label={t("forms:catalog.preview.howToChoose")} options={[
        { key: "one", label: t("forms:catalog.preview.one"), pressed: !multiple, onSelect: () => switchTo(false) },
        { key: "many", label: t("forms:catalog.preview.many"), pressed: multiple, onSelect: () => switchTo(true) },
      ]} />
    </div> : null}
    {multiple
      ? <PhoneFrame header={<>{close}{t("forms:catalog.preview.form")}</>} subtitle={t("forms:catalog.preview.chooseUpTo", { n: multipleMax })}>{list}{send}</PhoneFrame>
      : open
        ? <PhoneFrame header={<button type="button" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-left font-semibold">
          <span aria-hidden="true">{"‹"}</span>{question}
        </button>}>{list}</PhoneFrame>
        : <PhoneFrame header={<>{close}{t("forms:catalog.preview.form")}</>}>
          <div className="mx-3.5 my-2.5 flex flex-col gap-1.5">
            <span>{question}</span>
            <button type="button" onClick={() => setOpen(true)} disabled={options.length === 0}
              className={cn("flex h-[2.125rem] items-center justify-between rounded-[0.5rem] border border-[var(--borde2)] px-2.5 text-left", chosenText ? "text-[var(--t1)]" : "text-[var(--t3)]")}>
              {chosenText ?? t("forms:catalog.preview.choose")}<span aria-hidden="true">{"⌄"}</span>
            </button>
          </div>
          {send}
        </PhoneFrame>}
  </div>;
}

/**
 * La vista previa de un catálogo de los miembros o de los contactos en la compu (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos):
 * el teléfono con la lista abierta, como la dibuja WhatsApp, sin «Una opción | Varias». Lo de adentro es `PreviewListState`.
 */
export function CatalogListPhone(props: PreviewListProps) {
  const { t } = useTranslation("forms");
  return <PhoneFrame tall busy={props.updating} header={<><span aria-hidden="true">{"‹"}</span>{t("forms:catalog.preview.question")}</>}>
    <PreviewListState {...props} variant="phone" />
  </PhoneFrame>;
}

/**
 * En el teléfono (M-FRM-Catalogo-Filtros y M-FRM-Catalogo-Contactos), las opciones en una tarjeta de borde fino, sin marco ni
 * encabezado, con «y N opciones más (i)» debajo y «Ninguna opción» en una caja chica.
 */
export function CatalogListCard(props: PreviewListProps) {
  const { t } = useTranslation("forms");
  return <div role="group" aria-label={t("forms:catalog.preview.title")} aria-busy={props.updating} className="flex flex-col gap-2.5">
    <PreviewListState {...props} variant="card" />
  </div>;
}

/** Las opciones de un catálogo a mano en una tarjeta, para el teléfono (M-FRM-Catalogo, «Así lo ve quien lo recibe»). */
export function PreviewOptionsCard({ options }: { options: readonly PreviewOption[] }) {
  const { t } = useTranslation("forms");
  return <div role="group" aria-label={t("forms:catalog.preview.title")}>
    {options.length ? <OptionCards options={options} /> : <NoneBox />}
  </div>;
}

interface PreviewListProps {
  preview: FormCatalogPreviewResponse | undefined; updating: boolean; error?: unknown; onRetry?: () => void;
}

function OptionCards({ options }: { options: readonly { key?: string; text: string; detail?: string | null; issue?: FormCatalogPresentationIssue | null }[] }) {
  return <ul data-slot="preview-card" className="overflow-hidden rounded-[0.75rem] shadow-[0_0_0_1px_var(--borde)]">
    {options.map((option, index) => <li key={option.key ?? index} className="border-t border-[var(--borde)] px-3.5 py-2.5 first:border-t-0">
      <span className={cn("block wrap-break-word text-[0.9375rem]", option.issue === "TitleTooLong" && "text-[var(--peligro)]")}>{option.text}</span>
      {option.detail ? <span className={cn("block wrap-break-word text-[0.8125rem]", option.issue === "DescriptionTooLong" ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>{option.detail}</span> : null}
    </li>)}
  </ul>;
}

function NoneBox() {
  const { t } = useTranslation("forms");
  return <p className="rounded-[0.75rem] px-3.5 py-3 text-center text-[0.875rem] text-[var(--t3)] shadow-[0_0_0_1px_var(--borde)]">{t("forms:catalog.preview.none")}</p>;
}

/**
 * Lo que dice la lista: mientras se actualiza, las barras de carga («Actualizando»); sin opciones, «Ninguna opción»; con más
 * de las que entran, «y N opciones más» con su ⓘ. Sin respuesta (falta la persona de ejemplo), queda vacía. Si no se pudo
 * pedir, lo dice en su lugar, con «Reintentar».
 */
function PreviewListState({ preview, updating, error, onRetry, variant }: PreviewListProps & { variant: "phone" | "card" }) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const limit = useRetryAfterOf(error);
  const more = preview ? preview.total - preview.options.length : 0;
  const moreText = t("forms:catalog.preview.more", { count: more, n: format.formatInteger(more) });
  const card = variant === "card";
  if (error !== undefined && !updating) {
    return <div role="alert" className="flex flex-col items-center gap-2 px-3 py-6 text-center text-[var(--peligro)]">
      {t("forms:catalog.preview.error")}
      {/* El motivo, debajo: el que tradujo el back (la persona de ejemplo ya no está) o el común de red y 5xx (errores). */}
      <span className="text-[var(--t2)]">{apiErrorMessage(error, t)}</span>
      {onRetry ? <Button type="button" size="sm" variant="outline" disabled={limit.isRunning} onClick={onRetry}>{limit.label ?? t("common:actions.retry")}</Button> : null}
    </div>;
  }
  if (updating) {
    return <div className={cn("flex flex-col gap-3", card ? "rounded-[0.75rem] p-3.5 shadow-[0_0_0_1px_var(--borde)]" : "p-3.5")} aria-label={t("forms:catalog.preview.updating")} role="status">
      {["w-4/5", "w-3/5", "w-7/10"].map((width) => <span key={width} className={cn(loadingBlock, "h-2.5 rounded-full", width)} />)}
    </div>;
  }
  if (!preview) return null;
  const moreLine = more > 0 ? <p className={cn("flex items-center gap-1 text-[var(--t2)]", card ? "px-1 text-[0.8125rem]" : "px-3.5 py-2.5")}>{moreText}
    <InfoTip text={t("forms:catalog.preview.moreHelp", { total: format.formatInteger(preview.total), max: format.formatInteger(catalogLimits.previewOptions) })} title={moreText} />
  </p> : null;
  if (card) return <>{preview.options.length ? <OptionCards options={preview.options} /> : <NoneBox />}{moreLine}</>;
  return <div className="min-h-0 flex-1 overflow-hidden">
    {preview.options.length === 0 ? <p className="px-3 py-6 text-center text-[var(--t3)]">{t("forms:catalog.preview.none")}</p> : <ul className="flex flex-col">
      {preview.options.map((option, index) => <li key={index} className="flex items-center gap-2.5 border-b border-[var(--borde)] px-3.5 py-2">
        <span className="min-w-0 flex-1 leading-[1.3]">
          <span className="block break-words">{option.text}</span>
          {option.detail ? <span className="block break-words text-[0.6875rem] text-[var(--t3)]">{option.detail}</span> : null}
        </span>
        <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full border-[1.5px] border-[var(--borde2)]" />
      </li>)}
    </ul>}
    {moreLine}
  </div>;
}
