import { useTranslation } from "react-i18next";
import { timeZoneOffsetMinutes, useFormat } from "@/shared/format/useFormat";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Picker, type PickerOption } from "../Picker";

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Sin `FormField`, el nombre del campo. */
  label?: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** La zona horaria en la pieza para elegir (262): la ciudad y, en gris, la hora de su país y el desfase («Montevideo · hora
 *  de Uruguay · GMT−3»), en una sola lista para toda la app. Viaja el identificador de IANA: el desfase se calcula al
 *  mostrar. Se busca por ciudad, país o identificador. */
export function TimeZoneSelect({ value, onChange, placeholder, label, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: TimeZoneSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const format = useFormat();
  const ready = data !== undefined && !format.isLoading;
  const option = (zone: NonNullable<typeof data>["timeZones"][number]): PickerOption => ({
    value: zone.id,
    label: zone.city,
    description: [zone.countryTimeName, format.formatTimeZoneOffset(zone.id)].filter(Boolean).join(" · "),
    keywords: `${zone.id.replaceAll("_", " ")} ${zone.countryCodes.join(" ")}`,
  });
  const options = ready ? enabledOptions(data.timeZones)
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || timeZoneOffsetMinutes(left.id) - timeZoneOffsetMinutes(right.id)
      || left.city.localeCompare(right.city, data.culture))
    .map(option) : [];
  // Una zona ya deshabilitada sigue diciéndose en el campo.
  const kept = ready ? data.timeZones.filter((zone) => zone.id === value && !zone.isEnabled).map(option) : [];
  const waiting = isPending || format.isLoading;

  return <Picker id={id} label={label} options={options} selectedOptions={kept} value={value || null} onChange={onChange} describeChosen
    placeholder={waiting ? t("states.loading") : isError ? t("states.error") : placeholder}
    countLabel={(count) => t("fields.timeZoneCount", { count })}
    disabled={disabled || !ready} aria-invalid={invalid} aria-describedby={describedBy} />;
}
