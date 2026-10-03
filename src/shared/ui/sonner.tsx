"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

type ToastErrorOptions = Parameters<typeof toast.error>[1]

export function toastError(message: string, options?: ToastErrorOptions): void {
  toast.error(message, { ...options, duration: Number.POSITIVE_INFINITY, closeButton: true })
}

// La app usa tema claro. Los nombres accesibles de los avisos salen de i18n;
// las opciones del caller se mezclan sin perder el rótulo de cierre traducido.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { t } = useTranslation()

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
