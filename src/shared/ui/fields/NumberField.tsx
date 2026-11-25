import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NumberAmbiguousError } from "@/shared/format/parsers";
import { useFormat } from "@/shared/format/useFormat";
import { InformativeTooltip } from "../InformativeTooltip";
import { Input } from "../input";

interface NumberFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  digits?: number;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Sin rótulo propio, como una celda de una tabla editable (los límites de uso de Configuración). */
  "aria-label"?: string;
  /** La unidad a la derecha de un campo angosto («días», «meses»): los plazos de Configuración (272). */
  unit?: string;
  /** Apagado por algo que no es obvio: el motivo en un tooltip y en la descripción («No tenés permiso para cambiar la
   *  configuración.», WA-Config-Base2). */
  disabledReason?: string;
}

/** Cantidad cultural; digits fija la escala si el contrato lo requiere. */
export function NumberField({ value, onChange, onValidityChange, digits, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription, "aria-label": label, unit, disabledReason }: NumberFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  // 207: el número que se lee de dos maneras tiene su propio aviso.
  const [problem, setProblem] = useState<"invalidNumber" | "numberAmbiguous" | null>(null);
  const invalid = problem !== null;
  const [touched, setTouched] = useState(false);
  const displayed = !format.isLoading && value !== null
    ? digits === undefined ? format.formatQuantity(value) : format.formatDecimal(value, digits) : "";
  const inputValue = draft ?? displayed;

  function change(input: string) {
    setDraft(input);
    try {
      const parsed = format.parseDecimal(input);
      inputRef.current?.setCustomValidity("");
      setProblem(null);
      onValidityChange?.(true);
      onChange(parsed);
    } catch (error) {
      const next = error instanceof NumberAmbiguousError ? "numberAmbiguous" : "invalidNumber";
      inputRef.current?.setCustomValidity(t(`fields.${next}`));
      setProblem(next);
      onValidityChange?.(false);
      onChange(null);
    }
  }

  const showError = invalid && touched;
  const off = disabled === true && disabledReason !== undefined;
  const reasonId = `${messageId}-reason`;
  const description = [externalDescription, showError ? messageId : undefined, off ? reasonId : undefined].filter(Boolean).join(" ") || undefined;
  const input = <Input ref={inputRef} id={id} name={name} type="text" inputMode="decimal" value={inputValue} className={unit ? "w-27.5 flex-none" : undefined}
    onBlur={() => { if (invalid) setTouched(true); else setDraft(null); }}
    onChange={(event) => change(event.target.value)} disabled={disabled || format.isLoading}
    required={required} placeholder={placeholder} aria-busy={format.isLoading}
    aria-invalid={externalInvalid || showError} aria-describedby={description} aria-label={label} />;
  const control = off ? <InformativeTooltip text={disabledReason}>
    <span data-slot="disabled-reason" className="inline-flex cursor-not-allowed">{input}</span>
  </InformativeTooltip> : input;
  return <>
    {/* Tableros Config-Plat-Base2 y WA-Config-Base2 (.b2-num): el campo de 110 y la unidad a 8, en gris. */}
    {unit ? <span className="flex items-center gap-2">{control}<span className="text-[0.875rem] text-[var(--t2)]">{unit}</span></span> : control}
    {off ? <span id={reasonId} hidden>{disabledReason}</span> : null}
    {showError && <p id={messageId} role="alert" className="text-[0.8125rem] text-[var(--peligro)]">{t(`fields.${problem}`)}</p>}
  </>;
}
