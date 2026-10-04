import { useTranslation } from "react-i18next";
import { enabledOptions, type CurrencyReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { SearchSelect } from "../SearchSelect";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

// Tablero Configuración: la moneda lleva su código, «Peso argentino (ARS)».
function currencyLabel(currency: CurrencyReference): string {
  return `${currency.name} (${currency.code})`;
}

/** Selector de códigos monetarios: todos los datos visibles llegan del catálogo. */
export function CurrencySelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CurrencySelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const options = enabledOptions(data?.currencies ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture))
    .map((row) => ({ value: row.code, label: currencyLabel(row) }));
  const selected = data?.currencies.find((row) => row.code === value);

  return <SearchSelect id={id} options={options} value={value} onChange={onChange}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    searchLabel={t("fields.searchCurrency")} selectedLabel={selected ? currencyLabel(selected) : undefined}
    disabled={disabled || !data} busy={isPending} aria-invalid={invalid} aria-describedby={describedBy} />;
}
