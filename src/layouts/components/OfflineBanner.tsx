import { WifiOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { PhoneBand } from "@/shared/ui/app/PhoneBand";

/// Franja del navegador sin red; AppShell la desmonta en cuanto vuelve `online`.
export function OfflineBanner() {
  const { t } = useTranslation("errors");
  const label = t("offline");
  const { phone } = useAppChrome();

  // Tablero M-Avisos («Sin conexión»): en el teléfono, una banda roja clara debajo de la barra.
  if (phone) return <PhoneBand tone="danger" role="status" label={label} icon={<WifiOffIcon aria-hidden="true" className="mt-px size-[18px] shrink-0" />}>
    {label}
  </PhoneBand>;

  return (
    <div role="status" aria-label={label} className="flex min-h-9 items-center justify-center gap-2 bg-[var(--t1)] px-6 py-1.5 text-[13px] font-medium text-[var(--lado-activo)]">
      <WifiOffIcon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </div>
  );
}
