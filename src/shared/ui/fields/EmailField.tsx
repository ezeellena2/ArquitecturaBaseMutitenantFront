import type { ComponentProps } from "react";
import { Input } from "../input";

type EmailInputProps = Omit<ComponentProps<"input">, "type" | "value" | "onChange">;

interface EmailFieldProps extends EmailInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

/** El contrato de correo se normaliza al escribir, sin alterar otros atributos del formulario. */
export function EmailField({ value, onChange, ...inputProps }: EmailFieldProps) {
  return <Input {...inputProps} type="email" autoComplete="email" value={value ?? ""}
    onChange={(event) => onChange(event.target.value.trim().toLowerCase() || null)} />;
}
