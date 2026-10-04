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
    <FormField label={label} aside={<label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--t2)] lg:text-[13px]">
      <Checkbox checked={allChecked} disabled={options.length === 0} onCheckedChange={(checked) => toggleAll(checked === true)} />
      {allLabel}
    </label>}>
      <MultiSelect options={options} value={value} onChange={onChange} placeholder={placeholder} />
    </FormField>
  );
}
