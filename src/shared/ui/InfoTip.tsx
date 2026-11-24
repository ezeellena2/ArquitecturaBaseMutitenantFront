import { Info } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { InformativeTooltip } from "./InformativeTooltip";

/// La (i) de una ayuda («Criterio · Formularios», `.i-ay`; 116 y 211): gris, de 14, junto al rótulo de un campo, al título
/// de una caja o de una página, o al final de una opción. Su texto sale en un tooltip sobre ella, que se abre con el mouse,
/// el foco, un clic, un toque, Enter o Espacio, igual en la compu y en el teléfono, y lo cierran Escape o tocar afuera.
/// Tocarla no hace nada más: no marca la casilla ni elige la opción que acompaña, ni le pasa el foco al campo.
///
/// Es un botón que se alcanza con Tab, «Más información sobre {title}», descrito por su texto. El texto también es la
/// descripción accesible de lo que acompaña: quien la usa pone `id` en su `aria-describedby` y el lector lo lee al llegar
/// al campo. Va escondido (`hidden`) y la (i) va fuera del rótulo, así no se suman a su nombre. Un diálogo que se abre no
/// le da el foco aunque sea lo primero (`DialogContent`).
///
/// `standalone` es la (i) del estado en la banda (175, `.t10n-i`): no acompaña a un campo, así que la frase es su nombre
/// («El 18/09/2026, 16:45. Motivo: dos meses sin pago.»).
export function InfoTip({ id, text, title, className, standalone = false }: { id?: string; text: string; title: string; className?: string; standalone?: boolean }) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const generatedId = useId();
  const textId = id ?? generatedId;
  const icon = <Info aria-hidden="true" strokeWidth={2} className="size-3.5" />;
  // El área que se toca llega a 44 × 44 en el teléfono sin mover nada (187).
  const base = cn("relative inline-flex shrink-0 cursor-default items-center justify-center rounded-full align-middle text-[var(--t3)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--foco)]",
    phone && "after:absolute after:-inset-3.75", className);

  if (standalone) return <InformativeTooltip text={text}>
    <span role="img" tabIndex={0} aria-label={text} data-slot="info-tip" className={base}>{icon}</span>
  </InformativeTooltip>;

  return <>
    <span id={textId} hidden>{text}</span>
    <InformativeTooltip text={text}>
      <button type="button" data-slot="info-tip" aria-label={t("actions.moreInfo", { label: title })} aria-describedby={textId} className={base}>{icon}</button>
    </InformativeTooltip>
  </>;
}
