import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AccessMenu } from "@/tenancy/AccessMenu";
import { BrandMark } from "@/shared/ui/BrandMark";

interface TopbarProps {
  /** El ☰ que contrae el menú lateral; sin él, la barra lleva solo las migas y tu menú. */
  onToggleNavigation?: () => void;
  breadcrumbs?: ReactNode;
}

export function Topbar({ onToggleNavigation, breadcrumbs }: TopbarProps) {
  const { t } = useTranslation();

  return (
    // «Criterio · Marco»: la barra arena con las migas a la izquierda y tu menú a la derecha, con 16 de margen.
    <header className="flex h-[52px] items-center justify-between border-b border-[var(--borde)] bg-[var(--lado-activo)] px-0 text-[var(--t1)] md:border-[var(--lado-borde)] md:bg-[var(--lado)] md:px-4">
      <div className="flex min-w-0 items-center gap-0 md:gap-3">
        {onToggleNavigation ? <button type="button" onClick={onToggleNavigation} aria-label={t("layout.topbar.openOrCollapse")} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button> : null}
        <span className="flex items-center gap-2 text-[13px] font-bold md:hidden">
          <BrandMark compact />
          {t("app.name")}
        </span>
        {breadcrumbs ? <div className="hidden min-w-0 md:block">{breadcrumbs}</div> : null}
      </div>
      <AccessMenu />
    </header>
  );
}
