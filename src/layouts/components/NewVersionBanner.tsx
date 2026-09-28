import { RefreshCcwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

interface NewVersionBannerProps {
  onUpdate: () => void;
}

/// La versión nueva espera un clic explícito: no descarta formularios por su cuenta.
export function NewVersionBanner({ onUpdate }: NewVersionBannerProps) {
  const { t } = useTranslation("errors");
  const label = t("newVersion");

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
