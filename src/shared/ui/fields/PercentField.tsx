import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";

interface PercentFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** La persona escribe un porcentaje, mientras HTTP recibe una fracción. */
export function PercentField({ value, onChange, onValidityChange, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: PercentFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState(false);
  const displayed = !format.isLoading && value !== null ? format.formatPercent(value) : "";
  const inputValue = draft ?? displayed;

  function change(input: string) {
    setDraft(input);
    try {
      const parsed = format.parsePercent(input);
      inputRef.current?.setCustomValidity("");
      setInvalid(false);
      onValidityChange?.(true);
      onChange(parsed);
    } catch {
      inputRef.current?.setCustomValidity(t("fields.invalidPercent"));
      setInvalid(true);
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
      aria-invalid={externalInvalid || showError} aria-describedby={description} />
    {showError && <p id={messageId} role="alert" className="text-sm text-[var(--peligro)]">{t("fields.invalidPercent")}</p>}
  </>;
}
