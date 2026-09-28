import { WifiOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

/// Franja del navegador sin red; AppShell la desmonta en cuanto vuelve `online`.
export function OfflineBanner() {
  const { t } = useTranslation("errors");
  const label = t("offline");

  return (
    <div role="status" aria-label={label} className="flex min-h-9 items-center justify-center gap-2 bg-[var(--t1)] px-6 py-1.5 text-[13px] font-medium text-[var(--lado-activo)]">
      <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </div>
  );
}
