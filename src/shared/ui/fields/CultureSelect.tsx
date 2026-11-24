import { useTranslation } from "react-i18next";
import { nativeCultureName } from "@/shared/format/cultureName";
import { culturePreview } from "@/shared/format/culturePreview";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Picker } from "../Picker";

interface CultureSelectProps {
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

/** El idioma en la pieza para elegir (262). Las culturas disponibles vienen de Cultures, en su orden; cada una se nombra en
 *  su propia lengua («English (United States)», tablero Cuenta), para que cada persona encuentre la suya aunque no
 *  entienda la pantalla. Cada opción muestra debajo cómo se ven una fecha y un número. */
export function CultureSelect({ value, onChange, placeholder, label, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CultureSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const rows = enabledOptions(data?.cultures ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  const options = rows.map((row) => ({ value: row.code, label: nativeCultureName(row.code, row.name), description: culturePreview(data!, row.code),
    keywords: `${row.code} ${row.name}` }));
  const selected = data?.cultures.find((row) => row.code === value && !row.isEnabled);
  const kept = selected ? [{ value: selected.code, label: nativeCultureName(selected.code, selected.name) }] : [];

  return <Picker id={id} label={label} options={options} selectedOptions={kept} value={value || null} onChange={onChange}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    disabled={disabled || !data} aria-invalid={invalid} aria-describedby={describedBy} />;
}
