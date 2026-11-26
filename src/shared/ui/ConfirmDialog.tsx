import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { TextWithEmails } from "./format/EmailText";

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

/// Diálogo de confirmación para acciones que no se pueden deshacer. «Criterio · Decisiones» (161): el título nombra lo que
/// se decide («¿Dar de baja a Tomás Acosta?»), va sin ✕ y el foco arranca en «Cancelar», así Enter no confirma sin
/// querer. La confirmación es la principal; el rojo lleno (`destructive`) queda para lo que destruye.
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
  const cancel = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => { event.preventDefault(); cancel.current?.focus(); }}
        onCloseAutoFocus={restoreFocus}
        size="sm"
      >
        <DialogHeader>
          {/* Un correo del título baja de renglón donde lo parten los tableros (174): no ensancha la hoja del teléfono. */}
          <DialogTitle><TextWithEmails value={title} /></DialogTitle>
        </DialogHeader>
        {/* Tablero Avisos («¿Salir sin guardar?») y M-Avisos: el texto con la letra de los diálogos, con 20 de margen en la
            compu y 8/20/16 en la hoja del teléfono. */}
        {description ? <DialogDescription className="p-5 max-md:pt-2 max-md:pb-4"><TextWithEmails value={description} /></DialogDescription> : null}
        <DialogFooter>
          <Button ref={cancel} type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
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
