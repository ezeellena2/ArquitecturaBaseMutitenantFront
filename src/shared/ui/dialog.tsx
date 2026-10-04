import * as React from "react"
import { cn } from "cn"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
// El rótulo de cierre sale de la traducción, también para los lectores de pantalla.
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/ui/button"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[var(--velo)] backdrop-blur-[4px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  mobileFullHeight = false,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  mobileFullHeight?: boolean
}) {
  const { t } = useTranslation()

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed bottom-0 left-0 z-50 grid max-h-[calc(100dvh-1rem)] w-full gap-0 overflow-y-auto rounded-t-[16px] border border-[var(--borde)] bg-[var(--lado-activo)] p-0 text-[13px] shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[12px] md:data-[state=closed]:fade-out-0 md:data-[state=open]:fade-in-0",
          mobileFullHeight && "min-h-[calc(100dvh-1rem)] grid-rows-[auto_1fr_auto] md:min-h-0 md:grid-rows-none",
          className
        )}
        {...props}
        // Criterio-Dialogos: se cierra con ✕, Cancelar o Escape; un clic afuera no lo cierra.
        onInteractOutside={(event) => {
          onInteractOutside?.(event)
          event.preventDefault()
        }}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-[8px] text-[var(--t2)] transition-colors hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">{t("actions.close")}</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex min-h-12 flex-col justify-center gap-1 border-b border-[var(--borde)] bg-[var(--cab)] px-5 py-2 text-left", className)}
      {...props}
    />
  )
}

// Tablero «Criterio · Dialogos»: el cuerpo lleva 20 de margen y 14 entre campos. Lo que el título necesita aclarar
// (a quién le mandamos el código, qué se pierde) va acá adentro, nunca como bajada del encabezado.
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex flex-col gap-3.5 p-5", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[var(--borde)] bg-[var(--lado-activo)] px-5 py-3 [&_button]:w-full md:static md:flex-row md:justify-end md:[&_button]:w-auto",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{t("actions.close")}</Button>
        </DialogPrimitive.Close>
      ) : null}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[15px] leading-tight font-semibold text-[var(--t1)]", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[13px] leading-normal text-[var(--t2)]", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
