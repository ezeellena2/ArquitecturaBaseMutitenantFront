"use client"

import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

type ToastErrorOptions = Parameters<typeof toast.error>[1]

export function toastError(message: string, options?: ToastErrorOptions): void {
  toast.error(message, { ...options, duration: Number.POSITIVE_INFINITY, closeButton: true })
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

  return (
    <Sonner
      theme="light"
      position="bottom-right"
      richColors
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ duration: 4000, closeButton: false, closeButtonAriaLabel: t("notifications.close"), style: { padding: "12px 14px", gap: "10px", borderRadius: "10px", fontSize: "13px" }, ...toastOptions }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--width": "340px",
          "--border-radius": "10px",
          fontFamily: "var(--font-sans)",
          "--success-bg": "var(--ok-t)",
          "--success-border": "var(--ok)",
          "--success-text": "var(--ok)",
          "--error-bg": "var(--peligro-t)",
          "--error-border": "var(--peligro)",
          "--error-text": "var(--peligro)",
          "--warning-bg": "var(--alerta-t)",
          "--warning-border": "var(--alerta)",
          "--warning-text": "var(--alerta)",
          "--info-bg": "var(--marca-t)",
          "--info-border": "var(--marca)",
          "--info-text": "var(--marca-tx)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
