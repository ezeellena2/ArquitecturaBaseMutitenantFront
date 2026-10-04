import { useTranslation } from "react-i18next";
import { Button } from "./button";

interface LoadMoreProps {
  hasMore: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
}

// Pie de las listas por cursor: no hay conteo ni página numérica.
export function LoadMore({ hasMore, isLoading = false, onLoadMore }: LoadMoreProps) {
  const { t } = useTranslation();
  if (!hasMore) return null;

  return (
    // Tablero M-Auditoria-Org (.ap-mas): en el teléfono, un botón de 44 centrado, sin línea arriba.
    <div className="flex min-h-12 items-center justify-center px-4 py-2 max-md:pt-3.5 max-md:pb-5 md:border-t md:border-[var(--borde)]">
      <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={onLoadMore}
        className="h-7 max-md:h-11 max-md:rounded-[12px] max-md:px-[22px] max-md:text-[15px] lg:h-8">
        {isLoading ? t("states.loading") : t("pagination.loadMore")}
      </Button>
    </div>
  );
}
