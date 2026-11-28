import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { InfoTip } from "@/shared/ui/InfoTip";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/skeleton";
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
 * «Así lo ve quien lo recibe» (FRM-Catalogo y su teléfono): el teléfono con la pregunta cerrada y, al tocarla, la lista como la
 * dibuja WhatsApp, con «Una opción | Varias». Es una vista previa: los radios y las casillas imitan WhatsApp y no se mandan.
 * El segmentado es la excepción de dos vistas de lo mismo, y los radios, la de las vistas previas (picker-usage.test.ts).
 */
export function CatalogPreviewPhone({ options, withSwitch = true }: { options: readonly PreviewOption[]; withSwitch?: boolean }) {
  const { t } = useTranslation("forms");
  const [multiple, setMultiple] = useState(false);
  const [open, setOpen] = useState(false);
  const question = t("forms:catalog.preview.question");
  return <div className="flex flex-col gap-2.5">
    {withSwitch ? <SegmentedControl aria-label={t("forms:catalog.preview.howToChoose")} fullWidth options={[
      { key: "one", label: t("forms:catalog.preview.one"), pressed: !multiple, onSelect: () => setMultiple(false) },
      { key: "many", label: t("forms:catalog.preview.many"), pressed: multiple, onSelect: () => setMultiple(true) },
    ]} /> : null}
    <div role="group" aria-label={t("forms:catalog.preview.title")} className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[1.5rem] border-[0.375rem] border-[var(--t1)] bg-[var(--s2)] text-[0.78125rem]">
      {open ? <div className="flex min-h-[18rem] flex-col bg-[var(--superficie)]">
        <button type="button" onClick={() => setOpen(false)} className="flex items-center gap-2 border-b border-[var(--borde)] px-3 py-2.5 text-left font-semibold">
          <span aria-hidden="true">{"‹"}</span>{multiple ? t("forms:catalog.preview.chooseUpTo", { n: multipleMax }) : question}
        </button>
        <ul className="flex flex-col">
          {options.map((option) => <li key={option.key}>
            <label className="flex items-start gap-2.5 border-b border-[var(--borde)] px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className={cn("block break-words", option.issue === "TitleTooLong" && "text-[var(--peligro)]")}>{option.text}</span>
                {option.detail ? <span className={cn("block break-words", option.issue === "DescriptionTooLong" ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>{option.detail}</span> : null}
              </span>
              {/* Se marcan con el mouse y con el teclado, igual (accesibilidad). */}
              {multiple
                ? <input type="checkbox" className="mt-0.5 accent-[var(--ok)]" />
                : <input type="radio" name="catalog-preview" className="mt-0.5 accent-[var(--ok)]" />}
            </label>
          </li>)}
        </ul>
      </div> : <div className="flex min-h-[18rem] flex-col bg-[var(--superficie)]">
        <p className="flex items-center gap-2 border-b border-[var(--borde)] px-3 py-2.5 font-semibold"><span aria-hidden="true">{"×"}</span>{t("forms:catalog.preview.form")}</p>
        <div className="flex flex-1 flex-col gap-1.5 px-3 py-3">
          <span className="font-semibold">{question}</span>
          <button type="button" onClick={() => setOpen(true)} disabled={options.length === 0}
            className={cn("flex items-center justify-between rounded-md border border-[var(--borde2)] px-2.5 py-2 text-left text-[var(--t3)]")}>
            {t("forms:catalog.preview.choose")}<span aria-hidden="true">{"›"}</span>
          </button>
        </div>
        <p className="m-3 rounded-full bg-[var(--ok)] py-2 text-center font-semibold text-[var(--superficie)]">{t("forms:catalog.preview.send")}</p>
      </div>}
    </div>
  </div>;
}

/**
 * La vista previa de un catálogo de los miembros o de los contactos (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos): el
 * teléfono con la lista abierta, como la dibuja WhatsApp, sin «Una opción | Varias». Mientras se actualiza, un esqueleto
 * («Actualizando»); sin opciones, «Ninguna opción»; con más de las que entran, «y N opciones más» con su ⓘ. Sin respuesta
 * (falta la persona de ejemplo), la lista queda vacía. Si no se pudo pedir, lo dice en su lugar, con «Reintentar».
 */
export function CatalogListPhone({ preview, updating, error, onRetry }: {
  preview: FormCatalogPreviewResponse | undefined; updating: boolean; error?: unknown; onRetry?: () => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const limit = useRetryAfterOf(error);
  const more = preview ? preview.total - preview.options.length : 0;
  const moreText = t("forms:catalog.preview.more", { count: more, n: format.formatInteger(more) });
  return <div role="group" aria-label={t("forms:catalog.preview.title")} aria-busy={updating}
    className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[1.5rem] border-[0.375rem] border-[var(--t1)] bg-[var(--superficie)] text-[0.78125rem]">
    <p className="flex items-center gap-2 border-b border-[var(--borde)] px-3 py-2.5 font-semibold"><span aria-hidden="true">{"‹"}</span>{t("forms:catalog.preview.question")}</p>
    <div className="min-h-[18rem]">
      {error !== undefined && !updating ? <div role="alert" className="flex flex-col items-center gap-2 px-3 py-6 text-center text-[var(--peligro)]">
        {t("forms:catalog.preview.error")}
        {/* El motivo, debajo: el que tradujo el back (la persona de ejemplo ya no está) o el común de red y 5xx (errores). */}
        <span className="text-[var(--t2)]">{apiErrorMessage(error, t)}</span>
        {onRetry ? <Button type="button" size="sm" variant="outline" disabled={limit.isRunning} onClick={onRetry}>{limit.label ?? t("common:actions.retry")}</Button> : null}
      </div> : updating ? <div className="flex flex-col gap-3 p-3.5" aria-label={t("forms:catalog.preview.updating")} role="status">
        {["80%", "60%", "70%"].map((width) => <Skeleton key={width} className="h-2.5 rounded-full" style={{ width }} />)}
      </div> : preview ? <>
        {preview.options.length === 0 ? <p className="px-3 py-6 text-center text-[var(--t3)]">{t("forms:catalog.preview.none")}</p> : <ul className="flex flex-col">
          {preview.options.map((option, index) => <li key={index} className="flex items-start gap-2.5 border-b border-[var(--borde)] px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block break-words">{option.text}</span>
              {option.detail ? <span className="block break-words text-[var(--t3)]">{option.detail}</span> : null}
            </span>
            <span aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 rounded-full border-[1.5px] border-[var(--borde2)]" />
          </li>)}
        </ul>}
        {more > 0 ? <p className="flex items-center gap-1 px-3 py-2.5 text-[var(--t2)]">{moreText}
          <InfoTip text={t("forms:catalog.preview.moreHelp", { total: format.formatInteger(preview.total), max: format.formatInteger(catalogLimits.previewOptions) })} title={moreText} />
        </p> : null}
      </> : null}
    </div>
  </div>;
}
