import { useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { Button } from "./button";
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
      <div role="alert" className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-[var(--alerta)] bg-[var(--alerta-t)] px-4 py-2.5 text-[13px] text-[var(--alerta)] md:px-6">
        <TriangleAlertIcon aria-hidden="true" className="size-[18px] shrink-0" />
        <strong className="font-semibold">{t("concurrency.banner")}</strong>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={seeNew}>{t("concurrency.seeNew")}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onContinueEditing}>{t("concurrency.continueEditing")}</Button>
        </div>
      </div>
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
