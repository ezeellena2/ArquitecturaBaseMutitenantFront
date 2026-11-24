import { WifiOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { PhoneBand } from "@/shared/ui/app/PhoneBand";
import { noticeTones } from "@/shared/ui/noticeTones";

/// Franja del navegador sin red; AppShell la desmonta en cuanto vuelve `online`. Es el cartel que bloquea de «Criterio ·
/// Avisos» («Sin conexión»): blanco, con el filo y el ícono rojos (210).
export function OfflineBanner() {
  const { t } = useTranslation("errors");
  const label = t("offline");
  const { phone } = useAppChrome();

  // Tablero M-Avisos («Sin conexión»): en el teléfono, la banda de error debajo de la barra.
  if (phone) return <PhoneBand tone="danger" role="status" label={label} icon={<WifiOffIcon aria-hidden="true" className="mt-px size-4.5 shrink-0" />}>
    {label}
  </PhoneBand>;

  // Tablero Avisos («Sin conexión», .w-cartel.o-prob): en la compu, arriba de todo, a lo ancho, con la línea de las cajas
  // abajo y el filo de 3 a la izquierda; el ícono de 18 en el rojo del error y el texto en la tinta de siempre.
  return (
    <div role="status" aria-label={label} className={cn(
      "flex min-h-9 items-center gap-2.5 border-b border-l-[3px] border-[var(--borde)] bg-[var(--superficie)] py-1.5 pr-6 pl-3.5 text-[0.8125rem] text-[var(--t1)]",
      noticeTones.danger.edge,
    )}>
      <WifiOffIcon aria-hidden="true" className={cn("size-4.5 shrink-0", noticeTones.danger.icon)} />
      {label}
    </div>
  );
}
