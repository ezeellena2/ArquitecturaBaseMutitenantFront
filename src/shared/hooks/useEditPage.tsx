import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { PhoneBand } from "@/shared/ui/app/PhoneBand";
import { Banner } from "@/shared/ui/Banner";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

export interface EditPageOptions {
  /** Lo escrito difiere de lo guardado. */
  readonly isDirty: boolean;
  /** El error del último guardado de la pantalla (no el de sus diálogos: esos van arriba de sus botones). */
  readonly error: unknown;
  /** «Ver lo nuevo»: vuelve a leer la ficha y suelta lo escrito. */
  readonly onSeeNew: () => void;
  /** «Seguir editando»: cierra el aviso del 409 y conserva lo escrito. */
  readonly onContinueEditing: () => void;
  /** El texto de la franja, si la feature traduce un código propio (su `errors.ts`); por defecto, `actionErrorMessage`. */
  readonly errorMessage?: (error: unknown) => string | null;
}

export interface EditPage {
  /** El cartel del 409 `General.ConcurrencyConflict`, para el `banner` de `Page`; en el teléfono, también la banda del
   * error de guardado, debajo de la barra (M-Usuario y M-Pagina-Org, v106). */
  readonly banner: ReactNode;
  /** «Cambios sin guardar» para la segunda línea de la banda; `null` sin cambios. */
  readonly unsaved: ReactNode;
  /** La franja del error de guardado en la compu: todo salvo el 409 y lo que ya avisó el MutationCache (red, 5xx y 429).
   * En el teléfono va en `banner`. */
  readonly formError: ReactNode;
  /** «¿Salir sin guardar?» cuando una salida queda frenada por los cambios. */
  readonly leaveDialog: ReactNode;
  /** Deja pasar la próxima navegación sin preguntar: lo que sale después de guardar o de borrar. */
  readonly allowNextNavigation: () => void;
}

/// Lo común de una pantalla que edita algo que ya existe (tableros Avisos y «Criterio · Avisos y errores»): el cartel
/// del 409 debajo de la banda, «Cambios sin guardar» en la banda, la franja del error de guardado y la pregunta antes de
/// salir con cambios. Cada error va en un solo lugar.
export function useEditPage({ isDirty, error, onSeeNew, onContinueEditing, errorMessage }: EditPageOptions): EditPage {
  const { t } = useTranslation("errors");
  const { phone } = useAppChrome();
  const guard = useUnsavedChangesGuard(isDirty);
  const conflict = error instanceof ApiError && error.code === "General.ConcurrencyConflict";
  const message = conflict ? null : errorMessage ? errorMessage(error) : actionErrorMessage(error, t);

  return {
    banner: <>
      <ConcurrencyBanner error={error} isDirty={isDirty} onSeeNew={onSeeNew} onContinueEditing={onContinueEditing} />
      {/* Tableros M-Usuario y M-Pagina-Org («Error al guardar»): en el teléfono, el error con el texto del back va en la
          banda roja debajo de la barra, donde va lo que sigue pasando («Criterio · Decisiones»). */}
      {phone && message ? <PhoneBand tone="danger" role="alert" icon={<AlertCircleIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2} />}>
        <span className="min-w-0">{message}</span>
      </PhoneBand> : null}
    </>,
    unsaved: isDirty ? <span className="font-medium text-[var(--alerta)]">{t("unsaved.changes")}</span> : null,
    // Tablero Usuario («Error al guardar», .w-cartel.o-prob): en la compu, el cartel de problema debajo de la banda.
    formError: message && !phone ? <Banner tone="danger">{message}</Banner> : null,
    leaveDialog: <ConfirmDialog
      open={guard.isBlocked}
      onOpenChange={(open) => { if (!open) guard.stay(); }}
      title={t("unsaved.title")}
      description={t("unsaved.description")}
      confirmLabel={t("unsaved.leave")}
      cancelLabel={t("unsaved.continueEditing")}
      destructive
      onConfirm={guard.leave}
    />,
    allowNextNavigation: guard.allowNextNavigation,
  };
}
