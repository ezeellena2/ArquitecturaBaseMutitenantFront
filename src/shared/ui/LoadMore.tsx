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
    <div className="flex min-h-12 items-center justify-center border-t border-[var(--borde)] px-4 py-2">
      <Button type="button" variant="secondary" size="sm" disabled={isLoading} onClick={onLoadMore}
        className="min-h-11 md:min-h-8">
        {isLoading ? t("states.loading") : t("pagination.loadMore")}
      </Button>
    </div>
  );
}
