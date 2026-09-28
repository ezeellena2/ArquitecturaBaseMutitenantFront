import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";

export function FormatLoading({ className }: { className?: string }) {
  const { t } = useTranslation();
  return <span role="status" aria-label={t("states.loading")} className={className} />;
}

export function EmptyValue({ className }: { className?: string }) {
  const format = useFormat();
  const { t } = useTranslation();
  if (format.isLoading) return <FormatLoading className={className} />;
  return (
    <span role="img" aria-label={t("format:emptyLabel")} className={cn("text-[var(--t3)]", className)}>
      {format.formatEmpty()}
    </span>
  );
}
