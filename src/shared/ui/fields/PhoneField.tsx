import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { CountryFlag } from "@/shared/phone/CountryFlag";
import { phoneCountryOptions } from "@/shared/phone/countries";
import { formatPhoneDraft } from "@/shared/phone/phoneInput";
import { Input } from "../input";
import { CountrySelect } from "./CountrySelect";

export interface PhoneDraft {
  country: string;
  number: string;
}

interface PhoneFieldProps {
  value: PhoneDraft | null;
  onChange: (value: PhoneDraft | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  allowedCountries?: readonly string[];
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Selector accesible y número nacional; el backend hace la normalización definitiva. */
export function PhoneField({ value, onChange, onValidityChange, allowedCountries,
  id, name, disabled, required, "aria-invalid": invalid, "aria-describedby": describedBy }: PhoneFieldProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const data = format.referenceData;
  const countries = phoneCountryOptions(data?.countries ?? [], "", allowedCountries);
  const cultureCountry = data?.cultures.find((item) => item.code === format.culture)?.countryCode;
  const country = value?.country || countries.find((item) => item.code === cultureCountry)?.code || countries[0]?.code || "";
  const unavailable = disabled || format.isLoading || countries.length === 0;
  const liveInvalid = value?.number ? !formatPhoneDraft(value.number, country, countries).isValid : false;

  function changeNumber(raw: string) {
    const draft = formatPhoneDraft(raw, country, countries);
    onChange({ country: draft.country, number: draft.number });
    onValidityChange?.(draft.isValid);
  }

  function changeCountry(nextCountry: string) {
    const draft = formatPhoneDraft(value?.number ?? "", nextCountry, countries);
    onChange({ country: draft.country, number: draft.number });
    onValidityChange?.(draft.isValid);
  }

  return (
    <div className="flex gap-2">
      {/* El país compacto: la bandera y el prefijo («+54»), decisión del usuario del 2026-10-04, en una caja de 112 en la
          compu y de 124 en el teléfono (lienzo v99); la lista muestra la bandera y el nombre entero. */}
      <div className="w-[112px] shrink-0 max-md:w-[124px]">
        <CountrySelect value={country} onChange={changeCountry} allowedCountries={countries.map((item) => item.code)}
          placeholder={t("phone.country", { country: "" })} disabled={unavailable}
          renderValue={(selected) => <span className="inline-flex items-center gap-1.5">
            <CountryFlag countryCode={selected.code} title={selected.name} className="h-4 w-6 shrink-0" />
            {selected.callingCode ? `+${selected.callingCode}` : selected.code}
          </span>} />
      </div>
      <Input id={id} name={name} type="tel" autoComplete="tel-national" inputMode="tel"
        value={value?.number ?? ""} onChange={(event) => changeNumber(event.target.value)}
        disabled={unavailable} required={required} aria-busy={format.isLoading}
        aria-invalid={invalid || liveInvalid || undefined} aria-describedby={describedBy} />
    </div>
  );
}
