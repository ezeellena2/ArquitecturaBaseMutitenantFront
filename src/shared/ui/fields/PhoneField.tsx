import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
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
      <div className="min-w-36 shrink-0">
        <CountrySelect value={country} onChange={changeCountry} allowedCountries={countries.map((item) => item.code)}
          placeholder={t("phone.country", { country: "" })} disabled={unavailable} />
      </div>
      <Input id={id} name={name} type="tel" autoComplete="tel-national" inputMode="tel"
        value={value?.number ?? ""} onChange={(event) => changeNumber(event.target.value)}
        disabled={unavailable} required={required} aria-busy={format.isLoading}
        aria-invalid={invalid || liveInvalid || undefined} aria-describedby={describedBy} />
    </div>
  );
}
