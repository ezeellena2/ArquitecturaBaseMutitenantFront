import type { TFunction } from "i18next";
import { Building2, ClipboardList, Globe, Key, SlidersHorizontal, Users, type LucideIcon } from "lucide-react";
import type { PendingItem } from "@/shared/api/types";
import type { StatusTone } from "@/shared/ui/StatusDot";

export type HomeArea = "users" | "roles" | "companies" | "publicPage" | "settings" | "audit";

// Íconos y destinos del tablero Inicio-Org (llave para Roles y globo para la Página, como el tablero).
export const areaIcons: Record<HomeArea, LucideIcon> = {
  users: Users, roles: Key, companies: Building2, publicPage: Globe, settings: SlidersHorizontal, audit: ClipboardList,
};

export const areaPaths: Record<HomeArea, string> = {
  users: "/org/usuarios", roles: "/org/roles", companies: "/org/empresas", publicPage: "/org/pagina",
  settings: "/org/configuracion", audit: "/org/auditoria",
};

/** Como el tablero: el punto lleva el color del estado y el texto va oscuro, sin fondo. */
export const dotAsText = "bg-transparent px-0 text-[13px] font-normal text-[var(--t1)]";

export interface PendingRow {
  key: string;
  area: HomeArea;
  areaLabel: string;
  title: string;
  detail?: string;
  state: string;
  phoneState: string;
  tone: StatusTone;
  action: string;
  to: string;
  since: string | null;
}

/** Arma el texto de una fila de «Para resolver» (ADR 0040). Un tipo que el front no conoce no se muestra. */
export function describePending(item: PendingItem, index: number, t: TFunction,
  formatDate: (value: string) => string): PendingRow | null {
  const base = (area: HomeArea, kind: string, fields: { title: string; detail?: string; to: string }): PendingRow => {
    const state = t(`home:pending.${kind}.state`);
    return {
      key: `${index}-${kind}`, area, areaLabel: t(`home:cards.${area}.title`), state,
      phoneState: kind === "invitationExpired" ? t("home:pending.invitationExpired.phoneState") : state,
      tone: item.urgent ? "danger" : "warning", action: t(`home:pending.${kind}.action`), since: item.sinceUtc ?? null,
      ...fields,
    };
  };
  switch (item.kind) {
    case "invitationExpired":
      return base("users", item.kind, { title: item.subject ?? "", detail: t("home:pending.invitationExpired.detail"),
        to: "/org/usuarios?state=Expired" });
    case "deletionRequested":
      return base("users", item.kind, { title: item.subject ?? "",
        detail: item.dueAtUtc ? t("home:pending.deletionRequested.detail", { date: formatDate(item.dueAtUtc) }) : undefined,
        to: `/org/usuarios/${item.targetId ?? ""}` });
    case "domainUnverified":
      return base("settings", item.kind, { title: t("home:pending.domainUnverified.title"), detail: item.subject ?? undefined,
        to: areaPaths.settings });
    case "publicPageDraft":
    case "publicPageBlocked":
      return base("publicPage", item.kind, { title: t(`home:pending.${item.kind}.title`), to: areaPaths.publicPage });
    default:
      return null;
  }
}
