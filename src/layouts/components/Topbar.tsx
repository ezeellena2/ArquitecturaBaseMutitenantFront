import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AccessMenu } from "@/tenancy/AccessMenu";

interface TopbarProps {
  onToggleNavigation: () => void;
  breadcrumbs?: ReactNode;
}

export function Topbar({ onToggleNavigation, breadcrumbs }: TopbarProps) {
  const { t } = useTranslation();

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-[var(--lado-borde)] bg-[var(--lado)] px-3 text-[var(--t1)] md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onToggleNavigation} aria-label={t("layout.topbar.openOrCollapse")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 text-sm font-bold md:hidden">
          <span aria-hidden="true" className="size-7 rounded-[7px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)]" />
          {t("app.name")}
        </span>
        {breadcrumbs ? <div className="hidden min-w-0 md:block">{breadcrumbs}</div> : null}
      </div>
      <AccessMenu />
    </header>
  );
}
