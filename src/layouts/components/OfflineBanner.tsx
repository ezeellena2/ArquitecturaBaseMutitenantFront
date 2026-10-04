import { WifiOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";

/// Franja del navegador sin red; AppShell la desmonta en cuanto vuelve `online`.
export function OfflineBanner() {
  const { t } = useTranslation("errors");
  const label = t("offline");
  const { phone } = useAppChrome();

  // Tablero M-Avisos («Sin conexión»): en el teléfono, una banda roja clara debajo de la barra.
  if (phone) return <div role="status" aria-label={label} className="flex items-start gap-2.5 bg-[var(--peligro-t)] px-4 py-3 text-[14.5px] leading-[1.4] text-[var(--peligro-tx)]">
    <WifiOffIcon aria-hidden="true" className="mt-px size-[18px] shrink-0" />
    {label}
  </div>;

  return (
    <div role="status" aria-label={label} className="flex min-h-9 items-center justify-center gap-2 bg-[var(--t1)] px-6 py-1.5 text-[13px] font-medium text-[var(--lado-activo)]">
      <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </div>
  );
}
