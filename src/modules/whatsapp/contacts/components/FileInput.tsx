import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/// Tableros WA-Contactos-Importar y su M-* (.w-cmp .ct): el archivo elegido con «Cambiar» en petróleo, con la altura de un
/// campo. El control es el `input` de archivo, invisible y encima de la caja: lo nombra el rótulo de `FormField`, recibe
/// el foco con Tab y se abre con un clic en cualquier parte de la caja.
export function FileInput({ id, accept, fileName, placeholder, action, onFile, className, disabled,
  "aria-invalid": invalid, "aria-describedby": describedBy, "aria-required": required }: {
  id?: string;
  accept: string;
  fileName: string | null;
  placeholder: string;
  /** «Cambiar» o «Elegir archivo». */
  action: ReactNode;
  onFile: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}) {
  return <div className={cn("relative flex h-9 min-w-0 items-center gap-3 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 text-[13px]",
    "focus-within:border-[var(--marca)] focus-within:ring-[3px] focus-within:ring-[var(--foco-halo)] max-md:h-12 max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px]",
    invalid ? "border-[var(--peligro)]" : null, className)}>
    <input id={id} type="file" accept={accept} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} aria-required={required}
      className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      onChange={(event) => { onFile(event.target.files?.[0] ?? null); event.target.value = ""; }} />
    <span aria-hidden="true" className={cn("min-w-0 flex-1 truncate", fileName ? "text-[var(--t1)]" : "text-[var(--t3)]")}>{fileName ?? placeholder}</span>
    <span aria-hidden="true" className="shrink-0 font-semibold text-[var(--marca-tx)] max-md:text-[15px]">{action}</span>
  </div>;
}
