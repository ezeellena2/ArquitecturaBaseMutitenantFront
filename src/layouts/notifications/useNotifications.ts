import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "react-oidc-context";
import type { NotificationListResponse } from "@/shared/api/types";
import type { NotificationTone } from "@/shared/modules/types";
import { useModuleRegistry } from "@/shared/modules/useModules";
import { fetchNotifications, markNotificationRead, notificationsQueryKey } from "./api";
import { coreNotificationKinds } from "./kinds";
import { useNewVersion } from "./newVersion";
import { isAppPath } from "./paths";

/** Un aviso como lo dibuja la campana: uno de la API, ya leído con su `kind`, o la versión nueva que anuncia el front. */
export interface NotificationRow {
  key: string;
  text: string;
  tone: NotificationTone | "version";
  occurredAtUtc: string;
  unread: boolean;
  /** Adónde lleva: la ruta del front donde se resuelve. La versión nueva no lleva a ningún lado: recarga. */
  to: string | null;
  /** Lo que pasa al tocarlo, además de ir a `to`: un aviso sin leer se marca leído y la versión nueva recarga. */
  open: () => void;
}

export interface Notifications {
  rows: readonly NotificationRow[];
  /** El número de la campana: los que lista sin leer, con la versión nueva. */
  unread: number;
  status: "ready" | "loading" | "error";
  /** Vuelve a leer la lista: al abrir la campana y con «Reintentar». */
  refresh: () => void;
}

/** El aviso queda leído en la lista que ya se ve, sin esperar al back. */
function markReadIn(list: NotificationListResponse, id: string): NotificationListResponse {
  const target = list.items.find((item) => item.id === id);
  if (!target || target.read) return list;
  return { items: list.items.map((item) => item === target ? { ...item, read: true } : item), unread: Math.max(0, list.unread - 1) };
}

/**
 * La campana de quien mira (base de la 12), en los tres accesos: se lee al montarse, al volver el foco y al abrirse. Los
 * textos los arma el front con `kind` y `params`, primero con los del núcleo y después con los de los módulos instalados;
 * un `kind` que nadie describe no se muestra ni cuenta.
 */
export function useNotifications({ refetchOnMount = true }: { refetchOnMount?: boolean | "always" } = {}): Notifications {
  const auth = useContext(AuthContext);
  const enabled = auth?.isAuthenticated === true;
  const { t } = useTranslation("notifications");
  const newVersion = useNewVersion();
  const modules = useModuleRegistry();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: ({ signal }) => fetchNotifications(signal),
    enabled,
    refetchOnMount,
    refetchOnWindowFocus: "always",
    // No es la consulta principal de ninguna pantalla: si falla, lo dice su lista, sin el aviso de abajo.
    meta: { silent: true },
  });
  const markRead = useMutation({
    mutationFn: markNotificationRead,
    // Lo que no se pudo marcar vuelve sin leer en la próxima lectura: no vale un aviso abajo.
    meta: { handlesError: true },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      queryClient.setQueryData<NotificationListResponse>(notificationsQueryKey, (list) => list ? markReadIn(list, id) : list);
    },
    onError: () => { void queryClient.invalidateQueries({ queryKey: notificationsQueryKey }); },
  });

  const kinds = [...coreNotificationKinds, ...modules.flatMap((module) => module.notifications ?? [])];
  const rows: NotificationRow[] = [
    ...(newVersion ? [{ key: "new-version", text: t("newVersion"), tone: "version" as const, occurredAtUtc: newVersion.detectedAtUtc,
      unread: true, to: null, open: newVersion.reload }] : []),
    ...(query.data?.items ?? []).flatMap((item): NotificationRow[] => {
      const kind = kinds.find((entry) => entry.kind === item.kind);
      if (!kind) return [];
      const { text, tone } = kind.describe(item, t);
      return [{ key: item.id, text, tone, occurredAtUtc: item.occurredAtUtc, unread: !item.read, to: isAppPath(item.link) ? item.link : null,
        open: () => { if (!item.read) markRead.mutate(item.id); } }];
    }),
  ];

  return {
    rows,
    unread: rows.filter((row) => row.unread).length,
    status: query.data ? "ready" : query.isError ? "error" : enabled ? "loading" : "ready",
    refresh: () => { if (enabled) void query.refetch(); },
  };
}
