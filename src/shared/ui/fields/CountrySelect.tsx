import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/shared/phone/CountryFlag";
import { enabledOptions, type CountryReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Input } from "../input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function searchable(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function countryLabel(country: CountryReference): string {
  return country.callingCode ? `${country.name} (+${country.callingCode})` : country.name;
}

/** Países seleccionables, con bandera y prefijo telefónico cuando existe. */
export function CountrySelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CountrySelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const [search, setSearch] = useState("");
  const query = searchable(search.trim());
  const options = enabledOptions(data?.countries ?? [])
    .filter((country) => query === "" || searchable(`${country.name} ${country.code} ${country.callingCode ?? ""}`).includes(query)
      || (country.callingCode !== null && `+${country.callingCode}`.includes(query)))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  const selected = data?.countries.find((country) => country.code === value);
  const selectedLabel = selected
    ? `${t("phone.country", { country: selected.name })}${selected.callingCode ? `, +${selected.callingCode}` : ""}`
    : undefined;
  const unavailable = disabled || !data;

  return (
    <div className="flex flex-col gap-2">
      <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
        aria-label={t("actions.search")} placeholder={t("actions.search")} disabled={unavailable} />
      <Select value={value} onValueChange={onChange} disabled={unavailable}>
        <SelectTrigger id={id} aria-busy={isPending} aria-invalid={invalid} aria-describedby={describedBy}
          aria-label={selectedLabel} className="w-full text-[var(--t1)]">
          <SelectValue placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}>
            {selected ? countryLabel(selected) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <CountryFlag countryCode={country.code} title={country.name} className="h-4 w-6 shrink-0" />
                <span>{countryLabel(country)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
