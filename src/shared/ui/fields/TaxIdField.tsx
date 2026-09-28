import { stdnum } from "stdnum";
import { useTranslation } from "react-i18next";
import { enabledOptions, type TaxIdTypeReference } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Input } from "../input";

export interface TaxIdDraft {
  type: string;
  number: string;
}

interface TaxIdFieldProps {
  value: TaxIdDraft | null;
  onChange: (value: TaxIdDraft | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  /** Nombre traducido del selector, provisto por el formulario consumidor. */
  typeLabel: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

// Registro de algoritmos, no de tipos fiscales: los tipos y su ValidatorKey son datos.
const validators: Record<string, (number: string) => boolean> = {
  "ar-cuit-mod11": (number) => stdnum.AR.cuit.validate(number).isValid,
  "ar-dni-length": (number) => stdnum.AR.dni.validate(number).isValid,
};

function validTaxId(type: TaxIdTypeReference | undefined, number: string): boolean {
  return Boolean(type?.isEnabled && number && validators[type.validatorKey]?.(number));
}

/** Entrada E1: el país se deriva del tipo en Application, sin incluirlo en este contrato. */
export function TaxIdField({ value, onChange, onValidityChange, typeLabel,
  id, name, disabled, required, "aria-invalid": invalid, "aria-describedby": describedBy }: TaxIdFieldProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useReferenceData();
  const types = enabledOptions(data?.taxIdTypes ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, data?.culture));
  const selectedType = types.find((item) => item.code === value?.type);
  const number = value?.number ?? "";
  const liveInvalid = number !== "" && !validTaxId(selectedType, number);
  const unavailable = disabled || !data;

  function change(next: TaxIdDraft) {
    const type = types.find((item) => item.code === next.type);
    onChange(next);
    onValidityChange?.(validTaxId(type, next.number));
  }

  return (
    <div className="flex gap-2">
      <select value={value?.type ?? ""} onChange={(event) => change({ type: event.target.value, number })}
        disabled={unavailable} aria-busy={isPending} aria-label={typeLabel}
        className="h-9 min-w-36 rounded-md border border-input bg-transparent px-3 text-sm text-[var(--t1)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50">
        <option value="">{isPending ? t("states.loading") : isError ? t("states.error") : typeLabel}</option>
        {types.map((type) => <option key={type.code} value={type.code}>{type.name}</option>)}
      </select>
      <Input id={id} name={name} type="text" inputMode="numeric" autoComplete="off"
        value={number} onChange={(event) => change({ type: value?.type ?? "", number: event.target.value.replace(/\D/g, "") })}
        disabled={unavailable} required={required} aria-busy={isPending}
        aria-invalid={invalid || liveInvalid || undefined} aria-describedby={describedBy} />
    </div>
  );
}
