import type { ReactNode } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect, type MultiSelectOption } from "@/shared/ui/MultiSelect";

/// Roles con «Todos» como casilla junto al rótulo, nunca como una opción más (tablero Usuario).
export function RolesField({ label, allLabel, options, value, onChange, placeholder }: {
  label: string;
  allLabel: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}): ReactNode {
  const optionValues = options.map((option) => option.value);
  const allChecked = options.length > 0 && optionValues.every((option) => value.includes(option));

  function toggleAll(checked: boolean) {
    const others = value.filter((item) => !optionValues.includes(item));
    onChange(checked ? [...others, ...optionValues] : others);
  }

  return (
    // Tablero Usuario (.o-todos): con la letra del rótulo, en 500 y a 6 de la casilla. Tablero M-Usuario-Empresa
    // (.ap-todos): en el teléfono, en 14 con la casilla de 20, radio 6 y borde de 1,5, a 8 del texto.
    <FormField label={label} aside={<label className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--t2)] max-md:gap-2 max-md:text-[14px]">
      <Checkbox checked={allChecked} disabled={options.length === 0} onCheckedChange={(checked) => toggleAll(checked === true)}
        className="max-md:size-5 max-md:rounded-[6px] max-md:border-[1.5px] max-md:border-[var(--borde2)]" />
      {allLabel}
    </label>}>
      <MultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />
    </FormField>
  );
}
