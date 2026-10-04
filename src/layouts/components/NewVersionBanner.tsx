import { InfoIcon, RefreshCcwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { useAppChrome } from "@/shared/ui/app/AppChrome";

interface NewVersionBannerProps {
  onUpdate: () => void;
}

/// La versión nueva espera un clic explícito: no descarta formularios por su cuenta.
export function NewVersionBanner({ onUpdate }: NewVersionBannerProps) {
  const { t } = useTranslation("errors");
  const label = t("newVersion");
  const { phone } = useAppChrome();

  // Tablero M-Avisos («Versión nueva»): en el teléfono, una banda petróleo clara con «Actualizar» blanco a la derecha.
  if (phone) return <div role="status" aria-label={label} className="flex items-center justify-start gap-2.5 bg-[var(--marca-t)] py-2 pr-4 pl-4 text-[14.5px] leading-[1.4] text-[var(--marca-tx)]">
    <InfoIcon aria-hidden="true" className="size-[18px] shrink-0" />
    <span className="min-w-0 flex-1">{label}</span>
    <button type="button" onClick={onUpdate} className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--lado-activo)] px-3.5 text-[14.5px] font-semibold text-[var(--marca-tx)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
      {t("update")}
    </button>
  </div>;

  return (
    <div role="status" aria-label={label} className="flex min-h-9 flex-wrap items-center justify-center gap-2 border-b border-[var(--borde)] bg-[var(--marca-t)] px-6 py-1.5 text-[13px] font-medium text-[var(--marca-tx)]">
      <RefreshCcwIcon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
      <Button type="button" size="sm" variant="outline" onClick={onUpdate} className="ml-1">
        {t("update")}
      </Button>
    </div>
  );
}
