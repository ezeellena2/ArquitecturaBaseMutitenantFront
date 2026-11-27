import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { cn } from "@/shared/lib/utils";

export interface PreviewOption { readonly key: string; readonly text: string; readonly detail?: string | null }

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
    <div role="group" aria-label={t("forms:catalog.preview.title")} className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[1.5rem] border-[6px] border-[var(--t1)] bg-[var(--s2)] text-[0.78125rem]">
      {open ? <div className="flex min-h-[18rem] flex-col bg-white">
        <button type="button" onClick={() => setOpen(false)} className="flex items-center gap-2 border-b border-[var(--borde)] px-3 py-2.5 text-left font-semibold">
          <span aria-hidden="true">{"‹"}</span>{multiple ? t("forms:catalog.preview.chooseUpTo", { n: multipleMax }) : question}
        </button>
        <ul className="flex flex-col">
          {options.map((option) => <li key={option.key}>
            <label className="flex items-start gap-2.5 border-b border-[var(--borde)] px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block break-words">{option.text}</span>
                {option.detail ? <span className="block break-words text-[var(--t3)]">{option.detail}</span> : null}
              </span>
              {multiple
                ? <input type="checkbox" tabIndex={-1} className="mt-0.5 accent-[var(--ok)]" />
                : <input type="radio" name="catalog-preview" tabIndex={-1} className="mt-0.5 accent-[var(--ok)]" />}
            </label>
          </li>)}
        </ul>
      </div> : <div className="flex min-h-[18rem] flex-col bg-white">
        <p className="flex items-center gap-2 border-b border-[var(--borde)] px-3 py-2.5 font-semibold"><span aria-hidden="true">{"×"}</span>{t("forms:catalog.preview.form")}</p>
        <div className="flex flex-1 flex-col gap-1.5 px-3 py-3">
          <span className="font-semibold">{question}</span>
          <button type="button" onClick={() => setOpen(true)} disabled={options.length === 0}
            className={cn("flex items-center justify-between rounded-md border border-[var(--borde2)] px-2.5 py-2 text-left text-[var(--t3)]")}>
            {t("forms:catalog.preview.choose")}<span aria-hidden="true">{"›"}</span>
          </button>
        </div>
        <p className="m-3 rounded-full bg-[var(--ok)] py-2 text-center font-semibold text-white">{t("forms:catalog.preview.send")}</p>
      </div>}
    </div>
  </div>;
}
