import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NumberAmbiguousError } from "@/shared/format/parsers";
import { useFormat } from "@/shared/format/useFormat";
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
}

/** Cantidad cultural; digits fija la escala si el contrato lo requiere. */
export function NumberField({ value, onChange, onValidityChange, digits, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription, "aria-label": label }: NumberFieldProps) {
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
  const description = [externalDescription, showError ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <>
    <Input ref={inputRef} id={id} name={name} type="text" inputMode="decimal" value={inputValue}
      onBlur={() => { if (invalid) setTouched(true); else setDraft(null); }}
      onChange={(event) => change(event.target.value)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || showError} aria-describedby={description} aria-label={label} />
    {showError && <p id={messageId} role="alert" className="text-[0.8125rem] text-[var(--peligro)]">{t(`fields.${problem}`)}</p>}
  </>;
}
