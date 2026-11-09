import { Popover } from "radix-ui";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "react-oidc-context";
import { Link, useLocation } from "react-router";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { NumberText } from "@/shared/ui/format/NumberText";
import { BellIcon } from "./icons";
import { NotificationList } from "./NotificationList";
import { notificationsPath } from "./paths";
import { useNotifications } from "./useNotifications";

/** El nombre de la campana, con el número si hay algo sin leer («Avisos: 2»), como en los tableros. */
function useBellLabel(unread: number): string {
  const { t } = useTranslation("notifications");
  const format = useFormat();
  return unread > 0 ? t("bell", countOf(format, unread)) : t("title");
}

/**
 * La campana de la barra de arriba de la compu (tableros Campana y Campana-Plat, `.w-campana`): después de las migas y
 * antes de tu menú, con el número de lo que lista sin leer en un cuadrado chico. Abre «Avisos» debajo, alineada a la
 * derecha, y la vuelve a leer al abrirse. Sin sesión no se dibuja.
 */
export function NotificationBell() {
  const auth = useContext(AuthContext);
  return auth?.isAuthenticated === true ? <BellMenu /> : null;
}

function BellMenu() {
  const { t } = useTranslation("notifications");
  const { pathname } = useLocation();
  const notifications = useNotifications();
  const { unread } = notifications;
  const label = useBellLabel(unread);
  // Abierta en la pantalla donde se abrió: al pasar a otra (tocar un aviso, volver atrás), se cierra sola.
  const [openOn, setOpenOn] = useState<string | null>(null);

  return <Popover.Root open={openOn === pathname} onOpenChange={(open) => {
    setOpenOn(open ? pathname : null);
    if (open) notifications.refresh();
  }}>
    <Popover.Trigger asChild>
      <button type="button" aria-label={label}
        className="relative inline-flex size-9.5 shrink-0 items-center justify-center rounded-[0.25rem] text-[var(--t2)] hover:bg-[var(--lado-hover)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] data-[state=open]:bg-[var(--lado-hover)] data-[state=open]:text-[var(--t1)]">
        <BellIcon className="size-5" />
        {unread > 0 ? <span aria-hidden="true" className="absolute top-0.5 right-px inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[0.25rem] border-2 border-[var(--lado)] bg-[var(--marca)] px-1.25 text-[0.6875rem] leading-none font-bold text-[var(--lado-activo)]">
          <NumberText value={unread} />
        </span> : null}
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      {/* `.cmp-lista`: 420 de ancho, a 8 de la campana, con el borde y la sombra de un desplegable. */}
      <Popover.Content aria-label={t("title")} align="end" sideOffset={6} collisionPadding={16}
        className="z-50 flex max-h-(--radix-popover-content-available-height) w-105 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[0.25rem] border border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-[var(--sombra-menu)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--borde)] px-4 py-3 text-[0.9375rem] font-bold">
          {t("title")}
          {unread > 0 ? <span className="text-[0.8125rem] font-medium text-[var(--t3)]"><NumberText value={unread} /></span> : null}
        </div>
        <NotificationList variant="menu" notifications={notifications} onOpen={() => setOpenOn(null)} />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}

/**
 * La campana del teléfono (M-Cuentas, M-WA-Chats, M-Mas-Plat…, `.ap-campana`): un botón redondo de 44 en la barra de una
 * pantalla de primer nivel, que lleva a «Avisos» y le cuenta de dónde viene, para su ‹. `cover` es la de la cabecera
 * verde del Inicio de la organización (M-Inicio-Org, `.c-campana`): blanca, sobre un velo claro.
 */
export function PhoneNotificationBell({ to = notificationsPath, tone = "bar" }: { to?: string; tone?: "bar" | "cover" }) {
  const auth = useContext(AuthContext);
  return auth?.isAuthenticated === true ? <PhoneBell to={to} tone={tone} /> : null;
}

function PhoneBell({ to, tone }: { to: string; tone: "bar" | "cover" }) {
  const { pathname, search } = useLocation();
  const { unread } = useNotifications();
  const label = useBellLabel(unread);
  const cover = tone === "cover";

  return <Link to={to} state={{ from: `${pathname}${search}` }} aria-label={label}
    className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[var(--foco)]",
      cover ? "bg-[var(--lado-activo)]/14 text-[var(--lado-activo)]" : "text-[var(--t1)] hover:bg-[var(--s2)]")}>
    <BellIcon className="size-5" />
    {unread > 0 ? <span aria-hidden="true" className={cn("absolute top-0.5 right-0 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[0.3125rem] border-2 px-1.25 text-[0.6875rem] leading-none font-bold",
      cover ? "border-transparent bg-[var(--lado-activo)] text-[var(--marca-tx)]" : "border-[var(--lado-activo)] bg-[var(--marca)] text-[var(--lado-activo)]")}>
      <NumberText value={unread} />
    </span> : null}
  </Link>;
}
