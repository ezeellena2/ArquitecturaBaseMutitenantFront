import type { StatusTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { StatusDot, StatusDotMark } from "../StatusDot";
import { EmptyValue, FormatLoading } from "./EmptyValue";

/// Un estado del contrato como el lienzo: el punto del tono que registró su feature y la palabra de
/// `enums.<Enum>.<Valor>` («Criterio · Tablas»). Ningún color de estado se escribe en una pantalla.
export function StatusBadge<TState extends string>({ tones, value, className }: {
  tones: StatusTones<TState>;
  value: TState | null | undefined;
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <StatusDot tone={tones.tones[value] ?? "neutral"} label={format.formatEnum(tones.enum, value)} className={className} />;
}

/// El punto de un estado del contrato sin la palabra, cuando la palabra va dentro de otro texto con su letra (el estado
/// de la Página pública en la banda, un dominio en la línea de abajo): el tono sale del que registró su feature, como en
/// `StatusBadge`.
export function StatusMark<TState extends string>({ tones, value, className }: {
  tones: StatusTones<TState>;
  value: TState;
  className?: string;
}) {
  return <StatusDotMark tone={tones.tones[value] ?? "neutral"} className={className} />;
}
