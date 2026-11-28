"use client"

import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { AlertTriangleIcon, CircleCheckIcon, ErrorIcon, InfoIcon } from "@/shared/ui/icons"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

type ToastMessage = Parameters<typeof toast.success>[0]
type ToastOptions = Parameters<typeof toast.success>[1]
type ToastErrorOptions = Parameters<typeof toast.error>[1]

/// 210 («Criterio · Avisos»): todo aviso pasajero se va solo; el que salió bien, a los 4 s, y el de error, a los 10. El
/// que trae una acción, sea del tipo que sea, queda hasta cerrarlo.
export const toastDurations = { passing: 4000, error: 10_000 } as const

function passingOptions(options?: ToastOptions): ToastOptions | undefined {
  if (!options) return undefined
  return options.action ? { ...options, duration: Number.POSITIVE_INFINITY, closeButton: true } : options
}

/// Aviso de confirmación pasajero (4 s; si trae una acción, queda hasta cerrarlo).
export function toastSuccess(message: ToastMessage, options?: ToastOptions): void {
  const resolved = passingOptions(options)
  if (resolved === undefined) toast.success(message)
  else toast.success(message, resolved)
}

/// Aviso informativo pasajero (4 s; si trae una acción, queda hasta cerrarlo).
export function toastInfo(message: ToastMessage, options?: ToastOptions): void {
  const resolved = passingOptions(options)
  if (resolved === undefined) toast.info(message)
  else toast.info(message, resolved)
}

/// Aviso de advertencia pasajero (4 s; si trae una acción, queda hasta cerrarlo).
export function toastWarning(message: ToastMessage, options?: ToastOptions): void {
  const resolved = passingOptions(options)
  if (resolved === undefined) toast.warning(message)
  else toast.warning(message, resolved)
}

/// Lo que acaba de fallar, abajo, con la ✕: se va a los 10 s; con una acción («Reintentar», «Copiar código»), queda.
export function toastError(message: string, options?: ToastErrorOptions): void {
  toast.error(message, {
    ...options,
    duration: options?.action ? Number.POSITIVE_INFINITY : toastDurations.error,
    closeButton: true,
  })
}

/// Un 5xx (tablero Avisos, «Error del servidor»): el aviso de error que queda, con «Copiar código». En la compu el botón
/// va debajo del texto (`.aviso-codigo` en index.css); en el teléfono, al lado, como en M-Avisos. El código no se muestra.
export function toastErrorWithCode(message: string, copyCode: { label: string; onClick: () => void }): void {
  toastError(message, { action: copyCode, className: "aviso-codigo" })
}

// La app usa tema claro. Los nombres accesibles de los avisos salen de i18n;
// las opciones del caller se mezclan sin perder el rótulo de cierre traducido.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { t } = useTranslation()
  const phone = useMediaQuery("(max-width: 767px)")

  // Tablero M-Avisos: en el teléfono, una franja oscura abajo, a lo ancho, con el filo y el ícono del color de su tipo
  // (210, index.css).
  if (phone) return (
    <Sonner
      theme="light"
      position="bottom-center"
      richColors={false}
      mobileOffset={{ left: 12, right: 12, bottom: 16 }}
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: toastDurations.passing, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "0.8125rem 0.875rem 0.8125rem 1rem", gap: "0.625rem", borderRadius: "0.875rem", fontSize: "0.90625rem", lineHeight: "1.4" }, ...toastOptions }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <AlertTriangleIcon className="size-5" />,
        // M-Avisos (.f-snack .mal): el octógono del error, de 28.
        error: <ErrorIcon className="size-7" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={{ "--normal-bg": "var(--franja)", "--normal-text": "var(--superficie)", "--normal-border": "transparent", "--border-radius": "0.875rem", fontFamily: "var(--font-sans)" } as React.CSSProperties}
      {...props}
    />
  )

  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3 y Avisos según el tipo): en la compu, abajo a la
  // derecha, una tarjeta blanca de 340 con borde y sin sombra y el texto oscuro; el tipo va en el filo de 3 a la izquierda
  // y en el ícono, del mismo color (210, index.css).
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      offset="1.25rem"
      richColors={false}
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: toastDurations.passing, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "0.75rem 0.875rem", gap: "0.625rem", borderRadius: "0.25rem", fontSize: "0.8125rem" }, ...toastOptions }}
      className="toaster group"
      icons={{
        // Avisos (.p-aviso) y Avisos según el tipo: la tilde (círculo de 8,5), la (i), el triángulo y el octógono, de 18
        // con trazo 2.
        success: <CircleCheckIcon className="size-4.5" strokeWidth={2} />,
        info: <InfoIcon className="size-4.5" strokeWidth={2} />,
        warning: <AlertTriangleIcon className="size-4.5" strokeWidth={2} />,
        error: <ErrorIcon className="size-4.5" strokeWidth={2} />,
        loading: <Loader2Icon className="size-4.5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--superficie)",
          "--normal-text": "var(--t1)",
          "--normal-border": "var(--borde2)",
          "--width": "21.25rem",
          "--border-radius": "0.625rem",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
