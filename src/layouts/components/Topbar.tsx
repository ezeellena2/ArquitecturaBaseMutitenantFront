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
    <header className="flex h-[52px] items-center justify-between border-b border-[var(--borde)] bg-[var(--lado-activo)] px-0 text-[var(--t1)] md:border-[var(--lado-borde)] md:bg-[var(--lado)] md:px-2">
      <div className="flex min-w-0 items-center gap-0 md:gap-3">
        <button type="button" onClick={onToggleNavigation} aria-label={t("layout.topbar.openOrCollapse")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] md:size-10">
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 text-sm font-bold md:hidden">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-[7px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] shadow-[var(--shadow-card)]"><svg className="size-4 text-[var(--lado-activo)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
          {t("app.name")}
        </span>
        {breadcrumbs ? <div className="hidden min-w-0 md:block">{breadcrumbs}</div> : null}
      </div>
      <AccessMenu />
    </header>
  );
}
