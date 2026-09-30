import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { NavigationPanel } from "../navigation/types";

export function AdminPanel({ panel, open, isMobile, onClose }: { panel: NavigationPanel | null; open: boolean; isMobile: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  if (!panel || !open || isMobile) return null;

  return <nav aria-label={t(panel.labelKey)} className="relative flex h-full w-[232px] shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--panel)]">
    <div className="flex h-[52px] items-center border-b border-[var(--lado-borde)] px-4 text-sm font-bold text-[var(--t1)]">{t(panel.labelKey)}</div>
    <button type="button" aria-label={t("layout.sidebar.closeAdministration")} onClick={onClose} className="absolute -right-3.5 top-16 z-30 flex size-7 items-center justify-center rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-sm">
      <ChevronLeft size={15} aria-hidden="true" />
    </button>
    <div className="flex flex-col gap-0.5 px-2 py-3">
      {panel.links.map((entry) => entry.to ? <Link key={entry.labelKey} to={entry.to} className="flex min-h-[32px] items-center rounded-lg px-2 text-[13px] text-[var(--t2)] hover:bg-[var(--lado-hover)]">{t(entry.labelKey)}</Link> : null)}
    </div>
  </nav>;
}
