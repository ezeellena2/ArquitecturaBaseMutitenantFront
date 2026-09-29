import { useState } from "react";
import { useTranslation } from "react-i18next";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Input } from "../input";

interface CultureSelectProps {
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

/** Los nombres y culturas disponibles vienen de Cultures, ya traducidos por la API. */
export function CultureSelect({ value, onChange, placeholder, id, disabled, "aria-invalid": invalid,
  "aria-describedby": describedBy }: CultureSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const [search, setSearch] = useState("");
  const query = searchable(search.trim());
  const options = enabledOptions(data?.cultures ?? [])
    .filter((row) => query === "" || searchable(`${row.name} ${row.code}`).includes(query))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  const selected = data?.cultures.find((row) => row.code === value);
  const unavailable = disabled || !data;

  return (
    <div className="flex flex-col gap-2">
      <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
        aria-label={t("fields.searchCulture")} placeholder={t("fields.searchCulture")} disabled={unavailable} />
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}
        disabled={unavailable} aria-busy={isPending} aria-invalid={invalid} aria-describedby={describedBy}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-[var(--t1)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="">{isPending ? t("states.loading") : isError ? t("states.error") : placeholder}</option>
        {selected && !options.some((row) => row.code === value)
          ? <option value={selected.code} hidden>{selected.name}</option> : null}
        {options.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
      </select>
    </div>
  );
}
