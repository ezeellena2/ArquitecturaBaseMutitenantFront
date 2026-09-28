import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";

interface TimeFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** TimeOnly representa una hora civil y no se convierte a UTC. */
export function TimeField({ value, onChange, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: TimeFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const displayed = !format.isLoading && value !== null ? format.formatTime(value) : "";
  const inputValue = draft ?? displayed;

  function change(input: string) {
    setDraft(input);
    try {
      const parsed = format.parseTime(input);
      inputRef.current?.setCustomValidity("");
      setInvalid(false);
      onChange(parsed);
    } catch {
      inputRef.current?.setCustomValidity(t("fields.invalidTime"));
      setInvalid(true);
    }
  }

  const description = [externalDescription, invalid ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <>
    <Input ref={inputRef} id={id} name={name} type="text" inputMode="numeric" value={inputValue}
      onBlur={() => { if (!invalid) setDraft(null); }}
      onChange={(event) => change(event.target.value)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || invalid} aria-describedby={description} />
    {invalid && <p id={messageId} role="alert" className="text-sm text-[var(--peligro)]">{t("fields.invalidTime")}</p>}
  </>;
}
