import { useTranslation } from "react-i18next";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  /// Por defecto, "Cancelar". Cuando la confirmación es salir o quedarse, conviene nombrar lo que se conserva
  /// ("Seguir editando"): "Cancelar" frente a "Salir sin guardar" no dice si se cancela la salida o los cambios.
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  /** Adónde vuelve el foco si lo que la abrió se fue (la opción de un menú ⋮): el botón de ese menú. */
  returnFocusTo?: HTMLElement | null;
  /**
   * Para una acción que espera la red («Criterio · Diálogos», Mientras trabaja; base de la 12): con `pending` el diálogo
   * ya no se cierra solo al confirmar. Mientras es `true`, el botón final pone el aro y `pendingLabel` («Dando de
   * baja…»), y Cancelar y Escape quedan apagados. El dueño lo cierra cuando llega la respuesta, sea cual sea
   * (`onSettled`): lo que pasó lo dice el aviso de abajo.
   */
  pending?: boolean;
  pendingLabel?: string;
}

/// Diálogo de confirmación para acciones que no se pueden deshacer.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  returnFocusTo,
  pending,
  pendingLabel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const restoreFocus = useRestoreFocusOnClose(open, returnFocusTo);
  const waits = pending !== undefined;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <DialogContent
        showCloseButton={!destructive}
        onCloseAutoFocus={restoreFocus}
        size="sm"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Tablero Avisos («¿Salir sin guardar?») y M-Avisos: el texto con la letra de los diálogos, con 20 de margen en la
            compu y 8/20/16 en la hoja del teléfono. */}
        {description ? <DialogDescription className="p-5 max-md:pt-2 max-md:pb-4">{description}</DialogDescription> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            pending={pending}
            pendingLabel={pendingLabel}
            onClick={() => {
              onConfirm();
              if (!waits) onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
