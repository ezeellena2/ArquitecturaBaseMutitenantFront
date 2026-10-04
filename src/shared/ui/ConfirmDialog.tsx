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
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const restoreFocus = useRestoreFocusOnClose(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!destructive}
        onCloseAutoFocus={restoreFocus}
        className="md:max-w-[420px]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Tablero Avisos («¿Salir sin guardar?») y M-Avisos: el texto con la letra de los diálogos, con 20 de margen en la
            compu y 8/20/16 en la hoja del teléfono. */}
        {description ? <DialogDescription className="p-5 max-md:pt-2 max-md:pb-4">{description}</DialogDescription> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
