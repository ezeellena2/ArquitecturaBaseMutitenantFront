"use client"

import {
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { AlertCircleIcon, CircleCheckIcon } from "@/shared/ui/icons"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

type ToastErrorOptions = Parameters<typeof toast.error>[1]

export function toastError(message: string, options?: ToastErrorOptions): void {
  toast.error(message, { ...options, duration: Number.POSITIVE_INFINITY, closeButton: true })
}

/// Un 5xx (tablero Avisos, «Error del servidor»): el aviso rojo que queda, con «Copiar código». En la compu el botón va
/// debajo del texto (`.aviso-codigo` en index.css); en el teléfono, al lado, como en M-Avisos. El código no se muestra.
export function toastErrorWithCode(message: string, copyCode: { label: string; onClick: () => void }): void {
  toastError(message, { action: copyCode, className: "aviso-codigo" })
}

// La app usa tema claro. Los nombres accesibles de los avisos salen de i18n;
// las opciones del caller se mezclan sin perder el rótulo de cierre traducido.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { t } = useTranslation()
  const phone = useMediaQuery("(max-width: 767px)")

  // Tablero M-Avisos: en el teléfono, una franja oscura abajo, a lo ancho y con el ícono de color (index.css).
  if (phone) return (
    <Sonner
      theme="light"
      position="bottom-center"
      richColors={false}
      mobileOffset={{ left: 12, right: 12, bottom: 16 }}
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: 4000, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "0.8125rem 0.875rem 0.8125rem 1rem", gap: "0.625rem", borderRadius: "0.875rem", fontSize: "0.90625rem", lineHeight: "1.4" }, ...toastOptions }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        // M-Avisos (.f-snack .mal): el signo del error, de 28.
        error: <AlertCircleIcon className="size-7" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={{ "--normal-bg": "var(--franja)", "--normal-text": "var(--superficie)", "--normal-border": "transparent", "--border-radius": "0.875rem", fontFamily: "var(--font-sans)" } as React.CSSProperties}
      {...props}
    />
  )

  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3): en la compu, abajo a la derecha, una tarjeta
  // blanca de 340 con borde y sombra y el texto oscuro; solo el ícono lleva el color (index.css).
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      offset="1.25rem"
      richColors={false}
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: 4000, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "0.75rem 0.875rem", gap: "0.625rem", borderRadius: "0.25rem", fontSize: "0.8125rem" }, ...toastOptions }}
      className="toaster group"
      icons={{
        // Avisos (.p-aviso): la tilde y el signo del lienzo (círculo de 8,5), de 18 con trazo 2.
        success: <CircleCheckIcon className="size-4.5" strokeWidth={2} />,
        info: <InfoIcon className="size-4.5" />,
        warning: <TriangleAlertIcon className="size-4.5" />,
        error: <AlertCircleIcon className="size-4.5" strokeWidth={2} />,
        loading: <Loader2Icon className="size-4.5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--superficie)",
          "--normal-text": "var(--t1)",
          "--normal-border": "var(--borde)",
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
