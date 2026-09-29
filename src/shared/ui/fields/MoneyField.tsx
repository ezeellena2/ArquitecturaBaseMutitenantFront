import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MoneyValue } from "@/shared/format/formatters";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";
import { Label } from "../label";
import { CurrencySelect } from "./CurrencySelect";

interface MoneyFieldProps {
  value: MoneyValue | null;
  onChange: (value: MoneyValue | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Importe y código ISO viajan juntos; precisión y opciones vienen de Currencies. */
export function MoneyField({ value, onChange, onValidityChange, id, name, disabled, required, placeholder,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: MoneyFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const currencyId = useId();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [currencyOverride, setCurrencyOverride] = useState<{ base: string | null; selected: string } | null>(null);
  const currency = currencyOverride?.base === (value?.currency ?? null)
    ? currencyOverride.selected : value?.currency ?? (format.isLoading ? "" : format.currency);
  const currencyRow = format.isLoading ? null
    : format.referenceData.currencies.find((row) => row.code === value?.currency);
  const displayed = !format.isLoading && value !== null && currencyRow?.minorUnits !== null
    && currencyRow?.minorUnits !== undefined
    ? format.formatDecimal(value.amount, currencyRow.minorUnits) : "";
  const inputValue = draft ?? displayed;

  function change(input: string, selected: string) {
    setDraft(input);
    try {
      const parsed = format.parseMoney(input, selected);
      inputRef.current?.setCustomValidity("");
      setInvalid(false);
      onValidityChange?.(true);
      onChange(parsed);
    } catch {
      inputRef.current?.setCustomValidity(t("fields.invalidMoney"));
      setInvalid(true);
      onValidityChange?.(false);
      onChange(null);
    }
  }

  const showError = invalid && touched;
  const description = [externalDescription, showError ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <div className="flex flex-col gap-2">
    <Input ref={inputRef} id={id} name={name} type="text" inputMode="decimal" value={inputValue}
      onBlur={() => { if (invalid) setTouched(true); else setDraft(null); }}
      onChange={(event) => change(event.target.value, currency)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || showError} aria-describedby={description} />
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={currencyId}>{t("fields.currency")}</Label>
      <CurrencySelect id={currencyId} value={currency} placeholder={t("fields.selectCurrency")}
        onChange={(selected) => {
          setCurrencyOverride({ base: value?.currency ?? null, selected });
          if (inputValue !== "") change(inputValue, selected);
        }}
        disabled={disabled} aria-invalid={externalInvalid || showError} />
    </div>
    {showError && <p id={messageId} role="alert" className="text-sm text-[var(--peligro)]">{t("fields.invalidMoney")}</p>}
  </div>;
}
