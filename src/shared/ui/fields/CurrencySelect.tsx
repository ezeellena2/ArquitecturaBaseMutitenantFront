import { useTranslation } from "react-i18next";
import { currencyLabel, enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Picker } from "../Picker";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Sin `FormField`, el nombre del campo. */
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** La moneda en la pieza para elegir (262): todos los datos visibles llegan del catálogo. */
export function CurrencySelect({ value, onChange, placeholder, label, id, disabled, className, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CurrencySelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const options = enabledOptions(data?.currencies ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture))
    .map((row) => ({ value: row.code, label: currencyLabel(row) }));
  const selected = data?.currencies.find((row) => row.code === value && !row.isEnabled);
  const kept = selected ? [{ value: selected.code, label: currencyLabel(selected) }] : [];

  return <Picker id={id} label={label} options={options} selectedOptions={kept} value={value || null} onChange={onChange} className={className}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    disabled={disabled || !data} aria-invalid={invalid} aria-describedby={describedBy} />;
}
