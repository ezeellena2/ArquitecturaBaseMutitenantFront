import { useId, type ReactNode } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { MultiSelect, type MultiSelectOption } from "@/shared/ui/MultiSelect";

/// Roles con «Todos» como casilla junto al rótulo, nunca como una opción más (tablero Usuario).
/// Va acá y no en FormField mientras la pieza compartida no tenga ese lugar: está anotado para el Paquete 2.
export function RolesField({ label, allLabel, options, value, onChange, placeholder }: {
  label: string;
  allLabel: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}): ReactNode {
  const id = useId();
  const optionValues = options.map((option) => option.value);
  const allChecked = options.length > 0 && optionValues.every((option) => value.includes(option));

  function toggleAll(checked: boolean) {
    const others = value.filter((item) => !optionValues.includes(item));
    onChange(checked ? [...others, ...optionValues] : others);
  }

  return (
    <div className="flex flex-col gap-1.5 lg:gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[12px] font-semibold text-[var(--t2)] lg:text-[13px]">{label}</Label>
        <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--t2)] lg:text-[13px]">
          <Checkbox checked={allChecked} disabled={options.length === 0} onCheckedChange={(checked) => toggleAll(checked === true)} />
          {allLabel}
        </label>
      </div>
      <MultiSelect id={id} options={options} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
