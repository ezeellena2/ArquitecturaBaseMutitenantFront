import { useTranslation } from "react-i18next";
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

/** Los nombres y culturas disponibles vienen de Cultures, ya traducidos por la API. Cada opción muestra debajo
 *  cómo se ven una fecha y un número (tablero «Criterio · Formularios»). */
export function CultureSelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CultureSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const options = enabledOptions(data?.cultures ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture))
    .map((row) => ({ value: row.code, label: row.name, description: culturePreview(data!, row.code), keywords: row.code }));

  return <SearchSelect id={id} options={options} value={value} onChange={onChange}
    placeholder={isPending ? t("states.loading") : isError ? t("states.error") : placeholder}
    searchLabel={t("fields.searchCulture")} selectedLabel={data?.cultures.find((row) => row.code === value)?.name}
    disabled={disabled || !data} busy={isPending} aria-invalid={invalid} aria-describedby={describedBy} />;
}
