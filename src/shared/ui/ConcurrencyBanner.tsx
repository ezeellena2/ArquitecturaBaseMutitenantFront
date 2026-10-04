import { useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
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
      {/* Tablero «Criterio · Avisos»: cartel de atención, ámbar y sin borde; va en el lugar de Page para carteles. */}
      {phone ? null : <div role="alert" className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[10px] bg-[var(--alerta-t)] px-3.5 py-2.5 text-[13px] text-[var(--alerta)]">
        <TriangleAlertIcon aria-hidden="true" className="size-[18px] shrink-0" />
        <strong className="font-semibold">{t("concurrency.banner")}</strong>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={seeNew}>{t("concurrency.seeNew")}</Button>
          <Button type="button" variant="outline" size="sm" onClick={onContinueEditing}>{t("concurrency.continueEditing")}</Button>
        </div>
      </div>}
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
