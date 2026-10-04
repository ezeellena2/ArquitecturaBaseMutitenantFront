import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/shared/phone/CountryFlag";
import { enabledOptions, type CountryReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { SearchSelect, type SearchSelectOption } from "../SearchSelect";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  allowedCountries?: readonly string[];
  /** Lo que muestra el control para el país elegido; el teléfono muestra «AR +54». */
  renderValue?: (country: CountryReference) => ReactNode;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function countryLabel(country: CountryReference): string {
  return country.callingCode ? `${country.name} (+${country.callingCode})` : country.name;
}

/** Países seleccionables, con bandera y prefijo telefónico cuando existe. Se busca por nombre, código o prefijo. */
export function CountrySelect({ value, onChange, placeholder, id, disabled, allowedCountries, renderValue, className,
  "aria-invalid": invalid, "aria-describedby": describedBy }: CountrySelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const countries = enabledOptions(data?.countries ?? [])
    .filter((country) => !allowedCountries || allowedCountries.includes(country.code))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  // Lienzo v98: la bandera, el nombre y, a la derecha, el prefijo.
  const options: SearchSelectOption[] = countries.map((country) => ({
    value: country.code,
    label: country.name,
    trailing: country.callingCode ? `+${country.callingCode}` : undefined,
    keywords: country.callingCode ? `+${country.callingCode}` : undefined,
    icon: <CountryFlag countryCode={country.code} title={country.name} className="h-4 w-6 shrink-0" decorative />,
  }));
  const selected = data?.countries.find((country) => country.code === value);
  const selectedLabel = selected
    ? `${t("phone.country", { country: selected.name })}${selected.callingCode ? `, +${selected.callingCode}` : ""}`
    : undefined;

  return <SearchSelect id={id} options={options} value={value} onChange={onChange} className={className}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    searchLabel={t("fields.searchCountry")} selectedLabel={selected ? countryLabel(selected) : undefined}
    renderValue={() => (selected ? (renderValue?.(selected) ?? countryLabel(selected)) : null)}
    disabled={disabled || !data} busy={isPending} aria-label={selectedLabel}
    aria-invalid={invalid} aria-describedby={describedBy} />;
}
