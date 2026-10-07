import type { ComponentProps } from "react";
import type { TaxIdTypeReference } from "@/shared/referenceData/referenceData";
import { Input } from "../input";
import { taxIdMaxLength } from "./taxIdValidation";

type TaxIdNumberFieldProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "maxLength"> & {
  value: string;
  onChange: (number: string) => void;
  taxIdType: TaxIdTypeReference;
  /** Al cambiar un número guardado, el formulario puede resolverlo con otro tipo del catálogo. */
  newNumberType?: TaxIdTypeReference;
};

/** Solo número, sin selector: la máscara y el límite provienen del tipo que resuelve el formulario. */
export function TaxIdNumberField({ value, onChange, taxIdType, newNumberType, ...props }: TaxIdNumberFieldProps) {
  const limit = taxIdMaxLength(newNumberType ?? taxIdType);
  // Normaliza antes de limitar: los separadores pegados no consumen lugares de la máscara.
  return <Input {...props} type="text" inputMode="numeric" autoComplete="off" value={value}
    placeholder={taxIdType.mask}
    onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, limit))} />;
}
