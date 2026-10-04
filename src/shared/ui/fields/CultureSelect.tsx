import { useTranslation } from "react-i18next";
import { nativeCultureName } from "@/shared/format/cultureName";
import { culturePreview } from "@/shared/format/culturePreview";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { SearchSelect } from "../SearchSelect";

interface CultureSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/** Las culturas disponibles vienen de Cultures, en su orden; cada una se nombra en su propia lengua («English (United
 *  States)», tablero Cuenta), para que cada persona encuentre la suya aunque no entienda la pantalla. Cada opción
 *  muestra debajo cómo se ven una fecha y un número (tablero «Criterio · Formularios»). */
export function CultureSelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CultureSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const options = enabledOptions(data?.cultures ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture))
    .map((row) => ({ value: row.code, label: nativeCultureName(row.code, row.name), description: culturePreview(data!, row.code),
      keywords: `${row.code} ${row.name}` }));
  const selected = data?.cultures.find((row) => row.code === value);

  return <SearchSelect id={id} options={options} value={value} onChange={onChange}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    searchLabel={t("fields.searchCulture")} selectedLabel={selected ? nativeCultureName(selected.code, selected.name) : undefined}
    disabled={disabled || !data} busy={isPending} aria-invalid={invalid} aria-describedby={describedBy} />;
}
