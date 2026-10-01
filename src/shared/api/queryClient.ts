import { QueryCache, QueryClient } from "@tanstack/react-query";
import i18n from "@/shared/i18n";
import { toastError } from "@/shared/ui/sonner";
import { ApiError } from "./ApiError";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent === true || !(error instanceof ApiError)) return;

      // El cliente HTTP y la pantalla dueña del acceso resuelven estos estados.
      if (error.status === 401 || error.status === 403) return;

      if (error.isNetworkError) {
        toastError(i18n.t("network", { ns: "errors" }), {
          action: { label: i18n.t("actions.retry"), onClick: () => void query.fetch() },
        });
        return;
      }

      if (error.status >= 500) {
        toastError(i18n.t("server", { ns: "errors" }), error.traceId
          ? { description: i18n.t("traceId", { ns: "errors", traceId: error.traceId }) }
          : undefined);
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
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && (!(error instanceof ApiError) || error.isNetworkError),
    },
  },
});
