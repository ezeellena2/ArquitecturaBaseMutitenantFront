import { MutationCache, QueryCache, QueryClient, type DefaultOptions } from "@tanstack/react-query";
import i18n from "@/shared/i18n";
import { toastError } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { ApiError } from "./ApiError";
import { publishAccessError } from "./accessErrorStore";

/// Lo que una consulta le dice al manejo global de errores.
interface AppQueryMeta extends Record<string, unknown> {
  /** La pantalla muestra el error en su lugar (tabla con «Reintentar», ficha con su error): sin aviso abajo. */
  silent?: boolean;
  /** Es la consulta principal de la pantalla: un 403 la reemplaza por «No tenés permiso» o la organización no disponible. */
  blocksView?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: AppQueryMeta;
  }
}

const legalAcceptanceRequired = "Legal.AcceptanceRequired";

async function copyTraceId(traceId: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(traceId);
    toast.success(i18n.t("codeCopied", { ns: "errors" }));
  } catch {
    toastError(i18n.t("codeCopyFailed", { ns: "errors" }));
  }
}

/// El cliente HTTP solo transporta. Un 403 cambia la pantalla entera solo si viene de la consulta principal
/// (`meta.blocksView`); el de una consulta secundaria (opciones de un filtro, un conteo) queda en su lugar. Los términos
/// nuevos siguen su camino: bloquean desde cualquier consulta o mutación, y los resuelve `LegalAcceptanceGate`.
function publishesAccessError(error: ApiError, blocksView: boolean): boolean {
  return error.status === 403 && (error.code === legalAcceptanceRequired || blocksView);
}

const appDefaults: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    retry: (failureCount, error) => failureCount < 2 && (!(error instanceof ApiError) || error.isNetworkError),
  },
};

/// La app usa el cliente de abajo; los tests crean uno por render con los mismos avisos y sus propias opciones.
export function createQueryClient(defaultOptions: DefaultOptions = appDefaults): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (!(error instanceof ApiError)) return;
        if (publishesAccessError(error, query.meta?.blocksView === true)) publishAccessError(error);
        if (query.meta?.silent === true) return;

        // La pantalla dueña del acceso resuelve estos estados.
        if (error.status === 401 || error.status === 403) return;

        if (error.isNetworkError) {
          toastError(i18n.t("network", { ns: "errors" }), {
            action: { label: i18n.t("actions.retry"), onClick: () => void query.fetch() },
          });
          return;
        }

        if (error.status >= 500) {
          toastError(i18n.t("server", { ns: "errors" }), error.traceId ? {
            action: {
              label: i18n.t("copyCode", { ns: "errors" }),
              onClick: () => copyTraceId(error.traceId!),
            },
          } : undefined);
          return;
        }

        // Las queries no tienen un botón iniciador para mostrar la cuenta regresiva.
        // En los formularios la cuenta regresiva usa retryAfterSeconds del ApiError.
        if (error.status === 429) {
          toastError(i18n.t("rateLimited", { ns: "errors" }));
          return;
        }

        toastError(error.detail ?? i18n.t("states.error"));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Una mutación entrega su 403 al formulario; solo los términos nuevos bloquean la app.
        if (error instanceof ApiError && publishesAccessError(error, false)) publishAccessError(error);
      },
    }),
    defaultOptions,
  });
}

export const queryClient = createQueryClient();
