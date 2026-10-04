import { useTranslation } from "react-i18next";
import { timeZoneOffsetMinutes, useFormat } from "@/shared/format/useFormat";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { SearchSelect } from "../SearchSelect";

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Zona IANA; el offset se calcula al mostrar y nunca forma parte del valor. Se busca por ciudad, ID o país. */
export function TimeZoneSelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: TimeZoneSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const format = useFormat();
  const ready = data !== undefined && !format.isLoading;
  const options = ready ? enabledOptions(data.timeZones)
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || timeZoneOffsetMinutes(left.id) - timeZoneOffsetMinutes(right.id)
      || left.city.localeCompare(right.city, data.culture))
    .map((zone) => ({ value: zone.id, label: format.formatTimeZone(zone.id), keywords: `${zone.city} ${zone.countryCodes.join(" ")}` })) : [];
  const selected = ready ? data.timeZones.find((zone) => zone.id === value) : undefined;
  const waiting = isPending || format.isLoading;

  return <SearchSelect id={id} options={options} value={value} onChange={onChange}
    placeholder={waiting ? t("states.loading") : isError ? t("states.error") : placeholder}
    searchLabel={t("fields.searchTimeZone")} selectedLabel={selected ? format.formatTimeZone(selected.id) : undefined}
    disabled={disabled || !ready} busy={waiting} aria-invalid={invalid} aria-describedby={describedBy} />;
}
