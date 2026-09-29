import { useState } from "react";
import { useTranslation } from "react-i18next";
import { timeZoneOffsetMinutes, useFormat } from "@/shared/format/useFormat";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Input } from "../input";

interface TimeZoneSelectProps {
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

/** Zona IANA; el offset se calcula al mostrar y nunca forma parte del valor. */
export function TimeZoneSelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: TimeZoneSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const format = useFormat();
  const [search, setSearch] = useState("");
  const query = searchable(search.trim());
  const options = enabledOptions(data?.timeZones ?? [])
    .filter((zone) => query === "" || searchable(`${zone.city} ${zone.id} ${zone.countryCodes.join(" ")}`).includes(query))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || timeZoneOffsetMinutes(left.id) - timeZoneOffsetMinutes(right.id)
      || left.city.localeCompare(right.city, data?.culture));
  const selected = data?.timeZones.find((zone) => zone.id === value);
  const waiting = isPending || format.isLoading;
  const unavailable = disabled || !data || format.isLoading;

  return (
    <div className="flex flex-col gap-2">
      <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
        aria-label={t("fields.searchTimeZone")} placeholder={t("fields.searchTimeZone")} disabled={unavailable} />
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}
        disabled={unavailable} aria-busy={waiting} aria-invalid={invalid} aria-describedby={describedBy}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-[var(--t1)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="">{waiting ? t("states.loading") : isError ? t("states.error") : placeholder}</option>
        {!format.isLoading && selected && !options.some((zone) => zone.id === value)
          ? <option value={selected.id} hidden data-country-codes={selected.countryCodes.join(",")}>{format.formatTimeZone(selected.id)}</option> : null}
        {!format.isLoading && options.map((zone) => (
          <option key={zone.id} value={zone.id} data-country-codes={zone.countryCodes.join(",")}>
            {format.formatTimeZone(zone.id)}
          </option>
        ))}
      </select>
    </div>
  );
}
