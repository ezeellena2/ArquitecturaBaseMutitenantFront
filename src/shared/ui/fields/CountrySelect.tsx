import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/shared/phone/CountryFlag";
import { enabledOptions, type CountryReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Picker, type PickerOption } from "../Picker";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** El nombre del campo; por defecto, «País». */
  label?: string;
  id?: string;
  disabled?: boolean;
  busy?: boolean;
  allowedCountries?: readonly string[];
  /** Lo que muestra el campo cerrado para el país elegido; el teléfono muestra «AR +54». El lector oye el nombre. */
  renderValue?: (country: CountryReference) => ReactNode;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** El país en la pieza para elegir (262), con la bandera, el nombre y, a la derecha, el prefijo telefónico (lienzo v98).
 *  Se busca por nombre, código o prefijo. */
export function CountrySelect({ value, onChange, placeholder, label, id, disabled, busy, allowedCountries, renderValue, className,
  "aria-invalid": invalid, "aria-describedby": describedBy }: CountrySelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const countries = enabledOptions(data?.countries ?? [])
    .filter((country) => !allowedCountries || allowedCountries.includes(country.code))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  const option = (country: CountryReference): PickerOption => ({
    value: country.code,
    label: country.name,
    trailing: country.callingCode ? `+${country.callingCode}` : undefined,
    keywords: country.callingCode ? `+${country.callingCode}` : undefined,
    icon: <CountryFlag countryCode={country.code} title={country.name} className="h-4 w-6 shrink-0" decorative />,
    short: renderValue?.(country),
  });
  const selected = data?.countries.find((country) => country.code === value);
  const kept = selected && !countries.includes(selected) ? [option(selected)] : [];

  return <Picker id={id} label={label ?? t("fields.country")} options={countries.map(option)} selectedOptions={kept} value={value || null}
    onChange={onChange} className={className}
    placeholder={isPending || busy ? t("states.loading") : isError ? t("states.error") : placeholder}
    disabled={disabled || !data} aria-invalid={invalid} aria-describedby={describedBy} />;
}
