"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// La app usa tema claro. Los nombres accesibles de los avisos salen de i18n;
// las opciones del caller se mezclan sin perder el rótulo de cierre traducido.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { t } = useTranslation()

  return (
    <Sonner
      theme="light"
      containerAriaLabel={t("notifications.label")}
      toastOptions={{ closeButtonAriaLabel: t("notifications.close"), ...toastOptions }}
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
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
