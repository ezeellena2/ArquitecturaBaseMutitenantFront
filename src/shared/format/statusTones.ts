import type { ApiSchemas } from "@/shared/api/types";

/** El tono de un estado: pinta el punto (tema.md); la palabra va en el color del texto. */
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "pending";

/** Los cinco tonos del tema, en el orden de tema.md. */
export const statusTones = {
  available: ["success", "warning", "danger", "neutral", "pending"],
} as const satisfies { available: readonly StatusTone[] };

/// Los enums del contrato (`schema.d.ts`): el nombre del esquema y sus valores.
type ContractEnums = { [Name in keyof ApiSchemas as ApiSchemas[Name] extends string ? Name : never]: ApiSchemas[Name] };

/** Los tonos de un enum de estado: su texto sale de `enums.<Enum>.<Valor>` y su punto, del tono de cada valor. */
export interface StatusTones<TState extends string = string> {
  readonly enum: string;
  readonly tones: Readonly<Record<TState, StatusTone>>;
}

/// Cada feature registra los tonos de sus estados con el nombre del enum del contrato y el color que le da el lienzo a
/// cada estado («Criterio · Tablas»): TypeScript pide un tono por cada valor del enum. `StatusBadge` los pinta.
export function defineStatusTones<TEnum extends keyof ContractEnums>(enumName: TEnum,
  tones: Readonly<Record<ContractEnums[TEnum], StatusTone>>): StatusTones<ContractEnums[TEnum]> {
  return { enum: enumName, tones };
}
