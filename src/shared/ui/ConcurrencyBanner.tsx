import { useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { Banner } from "./Banner";
import { Button } from "./button";
import { useAppChrome } from "./app/AppChrome";
import { ConfirmDialog } from "./ConfirmDialog";

interface ConcurrencyBannerProps {
  error: unknown;
  isDirty: boolean;
  onSeeNew: () => void;
  onContinueEditing: () => void;
}

/// Solo el código de concurrencia pide elegir entre volver a cargar la ficha o conservar el draft.
export function ConcurrencyBanner({ error, isDirty, onSeeNew, onContinueEditing }: ConcurrencyBannerProps) {
  const { t } = useTranslation("errors");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { phone } = useAppChrome();

  if (!(error instanceof ApiError) || error.code !== "General.ConcurrencyConflict") return null;

  function seeNew() {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onSeeNew();
    }
  }

  return (
    <>
      {/* Tablero M-Avisos («Alguien cambió esto»): en el teléfono, una banda ámbar debajo de la barra, con las dos
          salidas en texto debajo del aviso. */}
      {phone ? <div role="alert" className="flex items-start gap-2.5 bg-[var(--alerta-t)] px-4 py-3 text-[14.5px] leading-[1.4] text-[var(--alerta-tx)]">
        <TriangleAlertIcon aria-hidden="true" className="mt-px size-[18px] shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          {t("concurrency.banner")}
          <span className="flex gap-[18px] font-semibold">
            <button type="button" onClick={onContinueEditing}>{t("concurrency.continueEditing")}</button>
            <button type="button" onClick={seeNew}>{t("concurrency.seeNew")}</button>
          </span>
        </span>
      </div> : null}
      {/* Tablero Avisos («Alguien cambió esto»): el cartel de atención de «Criterio · Avisos», en el lugar de Page para
          carteles, con «Seguir editando» en texto y «Ver lo nuevo» como botón chico. */}
      {phone ? null : <Banner tone="warning" role="alert" action={<>
        <Button type="button" variant="link" size="sm" onClick={onContinueEditing}>{t("concurrency.continueEditing")}</Button>
        <Button type="button" variant="outline" size="sm" onClick={seeNew}>{t("concurrency.seeNew")}</Button>
      </>}>{t("concurrency.banner")}</Banner>}
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
