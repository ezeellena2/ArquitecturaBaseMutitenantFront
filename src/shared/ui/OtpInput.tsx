import { useId, useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "./input";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  /// El código que se verificó no era el correcto: todas las casillas quedan marcadas hasta que se escriba otro.
  invalid?: boolean;
  /// Lo que dice el error del código (a medias, incorrecto): va debajo de los casilleros, marca las casillas y describe al
  /// grupo, como en Cuenta-Verificar. Lo demás (vencido, sin conexión) va en la franja del diálogo.
  error?: string | null;
  /// La primera casilla toma el foco al aparecer: en el diálogo del perfil, el código reemplaza al campo en el que se
  /// estaba escribiendo, y sin esto el foco se pierde con él.
  autoFocus?: boolean;
  /// Lo que describe al código entero (a dónde se mandó, cuándo vence), para el grupo de casillas. Hace falta cuando
  /// el foco llega directo a una casilla sin pasar por ese texto, como en el diálogo del perfil.
  "aria-describedby"?: string;
  /// `auth`: el ingreso y el registro, con las casillas a todo el ancho. Por defecto, el código de un diálogo.
  variant?: "default" | "auth";
  /// Si las casillas van marcadas (aria-invalid y borde rojo). Por defecto, con `invalid` o con `error`. El bloqueo de
  /// «Confirmá que sos vos» dice su error debajo sin marcarlas: las casillas van apagadas, en gris (tablero Cuenta-Plat).
  marked?: boolean;
}

// Tableros Ingreso y Registro (y sus M-*): seis casillas a todo el ancho, de 44, radio 8 y número de 22, también en el
// teléfono. «Criterio · Formularios» (Código) y Cuenta-Verificar: en un diálogo, casillas de 40 × 44 a la izquierda, radio 8
// y número de 18; en la hoja del teléfono (M-Cuenta-Verificar), a todo el ancho, de 52, radio 12 y número de 22. Las
// medidas `max-md:` van todas: si no, las del campo del teléfono (48, radio 12, letra de 16) se cuelan en el código.
// El código incorrecto marca el borde en rojo; en el ingreso y los registros (`.otp.mal input`), también el fondo rosado,
// y en un diálogo (Cuenta-Verificar y M-Cuenta-Verificar, `.p-otp.mal` y `.ap-cod6.mal`), solo el borde.
const layout = {
  auth: {
    group: "grid grid-cols-6 gap-2",
    box: "h-11 w-full rounded-[8px] text-[22px] max-md:h-11 max-md:rounded-[8px] max-md:text-[22px] aria-invalid:bg-[var(--peligro-t)] disabled:aria-invalid:bg-[var(--s2)]",
  },
  default: {
    group: "flex gap-2 max-md:grid max-md:grid-cols-6",
    box: "h-11 w-10 rounded-[8px] text-[18px] max-md:h-[52px] max-md:w-full max-md:rounded-[12px] max-md:text-[22px]",
  },
};

/// Casilleros para un código de un solo uso: avanzan solos, aceptan pegar y vuelven con Backspace. Los usan el ingreso
/// (como paso de `/login`) y el perfil, al comprobar un número o un correo.
export function OtpInput({
  length,
  value,
  onChange,
  label,
  disabled,
  invalid,
  error,
  marked: markedProp,
  autoFocus,
  "aria-describedby": hintId,
  variant = "default",
}: OtpInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = useId();
  const marked = markedProp ?? (invalid || Boolean(error));
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const normalizedValue = value.replace(/\D/gu, "").slice(0, length);
  const digits = normalizedValue.padEnd(length, " ").split("");

  function focusBox(index: number) {
    boxes.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const entered = event.target.value.replace(/\D/gu, "").slice(0, length);

    if (entered.length > 1) {
      onChange(entered);
      focusBox(entered.length);
      return;
    }

    if (!entered) {
      if (event.target.value === "" && index < normalizedValue.length) {
        onChange(normalizedValue.slice(0, index) + normalizedValue.slice(index + 1));
      }
      return;
    }

    const writeIndex = Math.min(index, normalizedValue.length);
    const next = normalizedValue.slice(0, writeIndex) + entered + normalizedValue.slice(writeIndex + 1);
    onChange(next);
    focusBox(writeIndex + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace") return;
    event.preventDefault();
    const eraseIndex = Math.min(index, normalizedValue.length - 1);
    if (eraseIndex < 0) return;
    onChange(normalizedValue.slice(0, eraseIndex) + normalizedValue.slice(eraseIndex + 1));
    focusBox(eraseIndex);
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/gu, "").slice(0, length);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    onChange(pasted);
    focusBox(pasted.length);
  }

  return (<>
    <div role="group" aria-label={label} aria-describedby={describedBy} className={layout[variant].group}>
      {digits.map((digit, index) => (
        <Input
          // El índice es la identidad real de cada casillero.
          key={index}
          ref={(element: HTMLInputElement | null) => {
            boxes.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0 ? autoFocus : undefined}
          maxLength={index === 0 ? length : 1}
          disabled={disabled}
          aria-label={`${label} ${index + 1}`}
          aria-invalid={marked ? true : undefined}
          value={digit.trim()}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          // Apagadas y marcadas (el bloqueo del ingreso, tablero Ingreso): el borde rojo sobre el gris de apagadas.
          className={cn(layout[variant].box, "border-[var(--borde2)] p-0 text-center font-semibold max-md:px-0 aria-invalid:border-[var(--peligro)] disabled:border-[var(--borde2)] disabled:bg-[var(--s2)] disabled:text-[var(--t3)] disabled:opacity-100 disabled:aria-invalid:border-[var(--peligro)]")}
        />
      ))}
    </div>
    {/* Tableros Cuenta-Verificar (.err2) y M-Cuenta-Verificar (.ap-err): debajo de los casilleros, en 13 y 13,5. */}
    {error ? <p id={errorId} role="alert" className="text-[13px] text-[var(--peligro)] max-md:-mt-0.5 max-md:text-[13.5px]">{error}</p> : null}
  </>);
}
