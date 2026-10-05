import { MutationCache, QueryCache, QueryClient, type DefaultOptions } from "@tanstack/react-query";
import i18n from "@/shared/i18n";
import { toastError, toastErrorWithCode } from "@/shared/ui/sonner";
import { toast } from "sonner";
import { ApiError } from "./ApiError";
import { publishAccessError } from "./accessErrorStore";
import { apiErrorMessage, isGenericApiError } from "./errorMessage";

/// Lo que una consulta le dice al manejo global de errores.
interface AppQueryMeta extends Record<string, unknown> {
  /** La pantalla muestra el error en su lugar (tabla con «Reintentar», ficha con su error): sin aviso abajo. */
  silent?: boolean;
  /** Es la consulta principal de la pantalla: un 403 la reemplaza por «No tenés permiso» o la organización no disponible. */
  blocksView?: boolean;
}

/// Lo que una mutación le dice al manejo global de errores.
interface AppMutationMeta extends Record<string, unknown> {
  /** La pantalla muestra también red, 5xx y 429 en su lugar (el ingreso, con la cuenta regresiva en el botón): sin aviso abajo. */
  handlesError?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: AppQueryMeta;
    mutationMeta: AppMutationMeta;
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

/// Red, 5xx y 429, iguales para consultas y mutaciones («Criterio · Avisos»): sin conexión, «Reintentar» vuelve a
/// pedir lo mismo; un 5xx ofrece copiar el código de seguimiento, que no se muestra; un 429 nunca se reintenta solo.
function toastGenericError(error: ApiError, retry: () => void): void {
  if (error.isNetworkError) {
    toastError(apiErrorMessage(error, i18n.t), { action: { label: i18n.t("actions.retry"), onClick: retry } });
  } else if (error.status === 429) {
    toastError(i18n.t("rateLimited", { ns: "errors" }));
  } else if (error.traceId) {
    const traceId = error.traceId;
    toastErrorWithCode(apiErrorMessage(error, i18n.t), { label: i18n.t("copyCode", { ns: "errors" }), onClick: () => copyTraceId(traceId) });
  } else {
    toastError(apiErrorMessage(error, i18n.t));
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

        // Las queries no tienen un botón iniciador para mostrar la cuenta regresiva de un 429.
        if (isGenericApiError(error)) toastGenericError(error, () => void query.fetch());
        else toastError(apiErrorMessage(error, i18n.t));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        if (!(error instanceof ApiError)) return;
        // Una mutación entrega su 403 al formulario; solo los términos nuevos bloquean la app.
        if (publishesAccessError(error, false)) publishAccessError(error);
        // Los errores de negocio los muestra la pantalla, en el formulario o en su aviso (actionErrorMessage).
        if (mutation.meta?.handlesError === true || !isGenericApiError(error)) return;
        // «Reintentar» repite la misma mutación con lo mismo: la clave idempotente se conserva ante red y 5xx, y
        // corren otra vez sus callbacks, así que la pantalla termina igual que si hubiera salido bien la primera vez.
        toastGenericError(error, () => { void mutation.execute(variables).catch(() => undefined); });
      },
    }),
    defaultOptions,
  });
}

export const queryClient = createQueryClient();
