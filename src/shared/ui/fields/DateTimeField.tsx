import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";

interface DateTimeFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** El reloj escrito corresponde a la zona efectiva; el valor emitido es UTC. */
export function DateTimeField({ value, onChange, onValidityChange, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: DateTimeFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState(false);
  const displayed = !format.isLoading && value !== null ? format.formatDateTime(value) : "";
  const inputValue = draft ?? displayed;

  function change(input: string) {
    setDraft(input);
    try {
      const parsed = format.parseDateTime(input);
      inputRef.current?.setCustomValidity("");
      setInvalid(false);
      onValidityChange?.(true);
      onChange(parsed);
    } catch {
      inputRef.current?.setCustomValidity(t("fields.invalidDateTime"));
      setInvalid(true);
      onValidityChange?.(false);
      onChange(null);
    }
  }

  const showError = invalid && touched;
  const description = [externalDescription, showError ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <>
    <Input ref={inputRef} id={id} name={name} type="text" inputMode="text" value={inputValue}
      onBlur={() => { if (invalid) setTouched(true); else setDraft(null); }}
      onChange={(event) => change(event.target.value)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || showError} aria-describedby={description} />
    {showError && <p id={messageId} role="alert" className="text-sm text-[var(--peligro)]">{t("fields.invalidDateTime")}</p>}
  </>;
}
