import { useState, type ReactNode } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect, type MultiSelectOption } from "@/shared/ui/MultiSelect";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { toastActionError } from "@/shared/api/errorMessage";
import { useTranslation } from "react-i18next";
import { useMountedRef } from "@/shared/hooks/useMountedRef";

/// Roles con «Todos» como casilla junto al rótulo, nunca como una opción más (tablero Usuario).
export function RolesField({ label, allLabel, options, value, onChange, placeholder, remote, selectedOptions, allOptions, allCount }: {
  label: string;
  allLabel: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  remote?: RemoteOptions;
  selectedOptions?: readonly MultiSelectOption[];
  allOptions?: () => Promise<readonly MultiSelectOption[]>;
  allCount?: number;
}): ReactNode {
  const { t } = useTranslation();
  const [selectingAll, setSelectingAll] = useState(false);
  const mounted = useMountedRef();
  const optionValues = options.map((option) => option.value);
  const allChecked = options.length > 0 && value.length >= (allCount ?? optionValues.length) && optionValues.every((option) => value.includes(option));

  async function toggleAll(checked: boolean) {
    if (allOptions) {
      setSelectingAll(true);
      try {
        const all = (await allOptions()).map((option) => option.value);
        if (mounted.current) onChange(checked ? [...new Set([...value, ...all])] : value.filter((item) => !all.includes(item)));
      } catch (error) { if (mounted.current) toastActionError(error, t); }
      finally { setSelectingAll(false); }
      return;
    }
    const others = value.filter((item) => !optionValues.includes(item));
    onChange(checked ? [...others, ...optionValues] : others);
  }

  return (
    // Tablero Usuario (.o-todos): con la letra del rótulo, en 500 y a 6 de la casilla. Tablero M-Usuario-Empresa
    // (.ap-todos): en el teléfono, en 14 con la casilla de 20, radio 6 y borde de 1,5, a 8 del texto.
    <FormField label={label} aside={<label className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--t2)] max-md:gap-2 max-md:text-[14px]">
      <Checkbox checked={allChecked} disabled={selectingAll || options.length === 0} onCheckedChange={(checked) => { void toggleAll(checked === true); }}
        className="max-md:size-5 max-md:rounded-[6px] max-md:border-[1.5px] max-md:border-[var(--borde2)]" />
      {allLabel}
    </label>}>
      <MultiSelect disabled={selectingAll} options={options} selectedOptions={selectedOptions} remote={remote} value={value} onChange={onChange} placeholder={placeholder} />
    </FormField>
  );
}
