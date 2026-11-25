import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MoneyValue } from "@/shared/format/formatters";
import { NumberAmbiguousError } from "@/shared/format/parsers";
import { useFormat } from "@/shared/format/useFormat";
import { Input } from "../input";
import { Label } from "../label";
import { CurrencySelect } from "./CurrencySelect";

interface MoneyFieldProps {
  /** ADR 0051: opt-in exclusivo para tarifas técnicas; presupuestos usan currency. */
  precision?: "currency" | "technical-tariff";
  /** Moneda del recurso cuando todavía no hay importe (sin reemplazar la selección del usuario). */
  currencyCode?: string;
  /** Un recurso que fija su moneda la muestra como unidad y no permite elegir otra. */
  fixedCurrency?: boolean;
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
export function MoneyField({ value, onChange, onValidityChange, id, name, disabled, required, placeholder, precision = "currency", currencyCode, fixedCurrency = false,
  "aria-invalid": externalInvalid, "aria-describedby": externalDescription }: MoneyFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const currencyId = useId();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  // 207: el número que se lee de dos maneras tiene su propio aviso.
  const [problem, setProblem] = useState<"invalidMoney" | "numberAmbiguous" | null>(null);
  const invalid = problem !== null;
  const [touched, setTouched] = useState(false);
  const [currencyOverride, setCurrencyOverride] = useState<{ base: string | null; selected: string } | null>(null);
  const currency = fixedCurrency ? currencyCode ?? value?.currency ?? (format.isLoading ? "" : format.currency ?? "") : currencyOverride?.base === (value?.currency ?? null)
    ? currencyOverride.selected : value?.currency ?? currencyCode ?? (format.isLoading ? "" : format.currency ?? "");
  const currencyRow = format.isLoading ? null
    : format.referenceData.currencies.find((row) => row.code === currency);
  const displayed = !format.isLoading && value !== null && currencyRow?.minorUnits !== null
    && currencyRow?.minorUnits !== undefined
    ? format.formatDecimal(value.amount, precision === "technical-tariff" ? 6 : currencyRow.minorUnits) : "";
  const inputValue = draft ?? displayed;

  function change(input: string, selected: string) {
    setDraft(input);
    try {
      const parsed = format.parseMoney(input, selected, precision);
      inputRef.current?.setCustomValidity("");
      setProblem(null);
      onValidityChange?.(true);
      onChange(parsed);
    } catch (error) {
      const next = error instanceof NumberAmbiguousError ? "numberAmbiguous" : "invalidMoney";
      inputRef.current?.setCustomValidity(t(`fields.${next}`));
      setProblem(next);
      onValidityChange?.(false);
      onChange(null);
    }
  }

  const showError = invalid && touched;
  // Un solo dueño por error (como MonthField): si el campo de afuera ya lo marca y lo dice, el aviso propio se calla.
  const showMessage = showError && !(externalInvalid && externalDescription);
  const description = [externalDescription, showMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <div className="flex flex-col gap-2">
    <div className="relative">{fixedCurrency ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--t2)]">{currency}</span> : null}<Input ref={inputRef} id={id} name={name} type="text" inputMode="decimal" value={inputValue} className={fixedCurrency ? "pl-14 max-md:pl-14" : undefined}
      onBlur={() => { if (invalid) setTouched(true); else setDraft(null); }}
      onChange={(event) => change(event.target.value, currency)} disabled={disabled || format.isLoading}
      required={required} placeholder={placeholder} aria-busy={format.isLoading}
      aria-invalid={externalInvalid || showError} aria-describedby={description} /></div>
    {!fixedCurrency ? <div className="flex flex-col gap-1.5">
      <Label htmlFor={currencyId}>{t("fields.currency")}</Label>
      <CurrencySelect id={currencyId} label={t("fields.currency")} value={currency} placeholder={t("fields.selectCurrency")}
        onChange={(selected) => {
          setCurrencyOverride({ base: value?.currency ?? null, selected });
          if (inputValue !== "") change(inputValue, selected);
        }}
        disabled={disabled} aria-invalid={externalInvalid || showError} />
    </div> : null}
    {showMessage && <p id={messageId} role="alert" className="text-[0.8125rem] text-[var(--peligro)]">{t(`fields.${problem}`)}</p>}
  </div>;
}
