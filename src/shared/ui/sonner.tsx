"use client"

import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
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
      toastOptions={{ duration: 4000, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "13px 14px 13px 16px", gap: "10px", borderRadius: "14px", fontSize: "14.5px", lineHeight: "1.4", boxShadow: "var(--sombra-franja)" }, ...toastOptions }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <CircleAlertIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={{ "--normal-bg": "var(--franja)", "--normal-text": "var(--lado-activo)", "--normal-border": "transparent", "--border-radius": "14px", fontFamily: "var(--font-sans)" } as React.CSSProperties}
      {...props}
    />
  )

  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3): en la compu, abajo a la derecha, una tarjeta
  // blanca de 340 con borde y sombra y el texto oscuro; solo el ícono lleva el color (index.css).
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      offset={20}
      richColors={false}
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: 4000, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "12px 14px", gap: "10px", borderRadius: "10px", fontSize: "13px", boxShadow: "var(--sombra-aviso)" }, ...toastOptions }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px]" />,
        info: <InfoIcon className="size-[18px]" />,
        warning: <TriangleAlertIcon className="size-[18px]" />,
        error: <CircleAlertIcon className="size-[18px]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--lado-activo)",
          "--normal-text": "var(--t1)",
          "--normal-border": "var(--borde)",
          "--width": "340px",
          "--border-radius": "10px",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
