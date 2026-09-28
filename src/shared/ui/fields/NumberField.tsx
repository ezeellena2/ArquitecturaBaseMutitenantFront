import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";

interface NumberFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  digits?: number;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Cantidad cultural; digits fija la escala si el contrato lo requiere. */
export function NumberField({ value, onChange, digits, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: NumberFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const displayed = !format.isLoading && value !== null
    ? digits === undefined ? format.formatQuantity(value) : format.formatDecimal(value, digits) : "";
  const inputValue = draft ?? displayed;

  function change(input: string) {
    setDraft(input);
    try {
      const parsed = format.parseDecimal(input);
      inputRef.current?.setCustomValidity("");
      setInvalid(false);
      onChange(parsed);
    } catch {
      inputRef.current?.setCustomValidity(t("fields.invalidNumber"));
      setInvalid(true);
    }
  }

  const description = [externalDescription, invalid ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <>
    <Input ref={inputRef} id={id} name={name} type="text" inputMode="decimal" value={inputValue}
      onBlur={() => { if (!invalid) setDraft(null); }}
      onChange={(event) => change(event.target.value)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || invalid} aria-describedby={description} />
    {invalid && <p id={messageId} role="alert" className="text-sm text-[var(--peligro)]">{t("fields.invalidNumber")}</p>}
  </>;
}
