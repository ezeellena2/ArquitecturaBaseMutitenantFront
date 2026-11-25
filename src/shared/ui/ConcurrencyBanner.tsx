import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { Banner } from "./Banner";
import { Button } from "./button";
import { useAppChrome } from "./app/AppChrome";
import { PhoneBand } from "./app/PhoneBand";
import { ConfirmDialog } from "./ConfirmDialog";
import { AlertTriangleIcon } from "./icons";

/** El aviso que dibuja el tablero de una pantalla para su 409, con una sola salida que trae lo guardado (WA-Config-Base2:
 *  «Otra persona cambió la configuración de WhatsApp. Revisá los valores actuales.» y «Revisar valores actuales»). */
export interface ConcurrencyTexts {
  message: string;
  seeNew: string;
}

interface ConcurrencyBannerProps {
  error: unknown;
  isDirty: boolean;
  onSeeNew: () => void;
  onContinueEditing: () => void;
  texts?: ConcurrencyTexts;
}

/// Solo el código de concurrencia pide elegir entre volver a cargar la ficha o conservar el draft.
export function ConcurrencyBanner({ error, isDirty, onSeeNew, onContinueEditing, texts }: ConcurrencyBannerProps) {
  const { t } = useTranslation("errors");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { phone } = useAppChrome();

  if (!(error instanceof ApiError) || error.code !== "General.ConcurrencyConflict") return null;

  const message = texts?.message ?? t("concurrency.banner");
  const seeNewLabel = texts?.seeNew ?? t("concurrency.seeNew");
  // Con el aviso propio de su tablero, la única salida es traer lo guardado.
  const continueEditing = texts ? null : t("concurrency.continueEditing");

  function seeNew() {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onSeeNew();
    }
  }

  return (
    <>
      {/* Tablero M-Avisos («Alguien cambió esto»): en el teléfono, la banda de atención debajo de la barra (blanca, con el
          filo y el triángulo ámbar, 210), con las dos salidas en texto debajo del aviso. */}
      {phone ? <PhoneBand tone="warning" role="alert" icon={<AlertTriangleIcon className="mt-px size-4.5 shrink-0" strokeWidth={2} />}>
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          {message}
          <span className="flex gap-4.5 font-semibold">
            {continueEditing ? <button type="button" onClick={onContinueEditing}>{continueEditing}</button> : null}
            <button type="button" onClick={seeNew}>{seeNewLabel}</button>
          </span>
        </span>
      </PhoneBand> : null}
      {/* Tablero Avisos («Alguien cambió esto»): el cartel de atención de «Criterio · Avisos», en el lugar de Page para
          carteles, con «Seguir editando» en texto y «Ver lo nuevo» como botón chico. */}
      {phone ? null : <Banner tone="warning" role="alert" action={texts
        ? <Button type="button" variant="link" size="sm" onClick={seeNew}>{seeNewLabel}</Button>
        : <>
          <Button type="button" variant="link" size="sm" onClick={onContinueEditing}>{continueEditing}</Button>
          <Button type="button" variant="outline" size="sm" onClick={seeNew}>{seeNewLabel}</Button>
        </>}>{message}</Banner>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("unsaved.title")}
        description={t("unsaved.description")}
        confirmLabel={t("unsaved.leave")}
        cancelLabel={t("unsaved.continueEditing")}
        destructive
        onConfirm={onSeeNew}
      />
    </>
  );
}
