import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DateText } from "@/shared/ui/format/DateText";
import { AlertCircleIcon, ChevronRightIcon, ClockIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/Spinner";
import { NewVersionIcon } from "./icons";
import type { NotificationRow, Notifications } from "./useNotifications";

type Variant = "menu" | "page";

// `.cmp-ic`: lo que espera a alguien, en ámbar con el reloj; lo que falló, en rojo con el «!»; la versión nueva, en la marca.
const toneIcons = { waiting: ClockIcon, failed: AlertCircleIcon, version: NewVersionIcon } as const;
const toneColors = {
  waiting: "bg-[var(--alerta-t)] text-[var(--alerta-tx)]",
  failed: "bg-[var(--peligro-t)] text-[var(--peligro)]",
  version: "bg-[var(--marca-t)] text-[var(--marca-tx)]",
} as const;

/**
 * Un aviso. En la compu (tableros Campana y Campana-Plat, `.cmp-it`): el ícono de 32 con su tono, el texto entero y,
 * debajo, la fecha y la hora; sin leer, en 600 y con el punto de la marca a la derecha. En el teléfono (M-Campana*,
 * `.cp-fila`): más grande, con la línea de abajo y, ya leído, la flecha.
 */
function NotificationEntry({ row, variant, onOpen }: { row: NotificationRow; variant: Variant; onOpen?: () => void }) {
  const { t } = useTranslation("notifications");
  const page = variant === "page";
  const Icon = toneIcons[row.tone];
  const open = () => {
    row.open();
    onOpen?.();
  };
  const className = cn("flex w-full items-start gap-3 text-left text-[var(--t1)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
    page ? "border-b border-[var(--borde)] px-4 py-3.5" : "px-4 py-3 hover:bg-[var(--s2)]");
  const body = <>
    <span aria-hidden="true" className={cn("inline-flex size-8 shrink-0 items-center justify-center", page ? "rounded-[0.5625rem]" : "rounded-[0.25rem]", toneColors[row.tone])}>
      <Icon className="size-4.5" />
    </span>
    <span className={cn("flex min-w-0 flex-1 flex-col leading-[1.35]", page ? "gap-0.75 text-[0.96875rem]" : "gap-0.5 text-[0.875rem]", row.unread ? "font-semibold" : null)}>
      {/* Sin leer no es solo el punto: el lector lo dice después del texto. */}
      <span>{row.text}{row.unread ? <span className="sr-only">{t("unreadMark")}</span> : null}</span>
      <DateText value={row.occurredAtUtc} kind="dateTime" className={cn("font-normal text-[var(--t3)]", page ? "text-[0.8125rem]" : "text-[0.78125rem]")} />
    </span>
    {row.unread ? <span aria-hidden="true" className={cn("shrink-0 self-center rounded-full bg-[var(--marca)]", page ? "size-2.25" : "size-2")} />
      : page ? <ChevronRightIcon strokeWidth={2} className="size-4.5 shrink-0 self-center text-[var(--t3)]" /> : null}
  </>;

  return row.to
    ? <Link to={row.to} onClick={open} className={className}>{body}</Link>
    : <button type="button" onClick={open} className={className}>{body}</button>;
}

/**
 * Los avisos de la campana, del más nuevo al más viejo y con la versión nueva primera: en la compu, dentro de su lista
 * (`menu`); en el teléfono, la pantalla «Avisos» (`page`). Sin avisos, «No hay avisos.» (`.cmp-vacia` y `.ap-vacio`).
 */
export function NotificationList({ notifications, variant, onOpen }: {
  notifications: Notifications;
  variant: Variant;
  /** Después de tocar un aviso: la lista de la compu se cierra. */
  onOpen?: () => void;
}) {
  const { t } = useTranslation(["notifications", "common"]);
  const page = variant === "page";
  const { rows, status } = notifications;

  if (rows.length > 0) return <ul className={page ? undefined : "min-h-0 overflow-y-auto"}>
    {rows.map((row) => <li key={row.key} className={page ? undefined : "border-t border-[var(--borde)] first:border-t-0"}>
      <NotificationEntry row={row} variant={variant} onOpen={onOpen} />
    </li>)}
  </ul>;

  const state = page ? "px-6 py-12 text-[1rem] font-semibold text-[var(--t1)]" : "px-4 py-7 text-[0.875rem] text-[var(--t2)]";
  if (status === "loading") return <div className={cn("flex justify-center", state)}><Spinner /></div>;
  if (status === "error") return <div className={cn("flex flex-col items-center gap-3 text-center", state)}>
    <p>{t("loadError")}</p>
    <Button type="button" variant="outline" size="sm" onClick={notifications.refresh} className={page ? "h-11 px-5 text-[0.9375rem]" : undefined}>
      {t("common:actions.retry")}
    </Button>
  </div>;
  return <p className={cn("text-center", state)}>{t("empty")}</p>;
}
