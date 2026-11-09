import type { TFunction } from "i18next";
import type { NotificationItem } from "@/shared/api/types";
import type { ModuleNotificationKind } from "@/shared/modules/types";

type NamedKind = "organizationPending" | "recoveryRequested";

/** El aviso con el nombre que trae en `params.name`; sin él, el mismo aviso sin nombre. */
function named(item: NotificationItem, t: TFunction, kind: NamedKind): string {
  const name = item.params.name;
  return typeof name === "string" && name.trim() !== ""
    ? t(`notifications:kinds.${kind}`, { name: name.trim() })
    : t(`notifications:kinds.${kind}Unnamed`);
}

/**
 * Los avisos del núcleo (B2), en el idioma de quien mira: los tres esperan a alguien (el reloj de los tableros Campana,
 * Campana-Plat y M-Campana-Personal). Las claves de `params` las fija el back en la B2; hasta entonces el front lee:
 * - `personalLoginMethod`: ninguna;
 * - `organizationPending`: `name`, la organización que espera aprobación («Gamma S.A. espera aprobación»);
 * - `recoveryRequested`: `name`, la persona que pidió recuperar su cuenta («Pablo Ortiz pidió recuperar su cuenta»).
 */
export const coreNotificationKinds: readonly ModuleNotificationKind[] = [
  { kind: "personalLoginMethod", describe: (_item, t) => ({ text: t("notifications:kinds.personalLoginMethod"), tone: "waiting" }) },
  { kind: "organizationPending", describe: (item, t) => ({ text: named(item, t, "organizationPending"), tone: "waiting" }) },
  { kind: "recoveryRequested", describe: (item, t) => ({ text: named(item, t, "recoveryRequested"), tone: "waiting" }) },
];
