import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function ErrorPageFrame({ icon, title, description, homePath = "/org", onHomeClick }: {
  icon: ReactNode;
  title: string;
  description: string;
  homePath?: string;
  onHomeClick?: () => void;
}) {
  const { t } = useTranslation("errors");
  return <div className="flex min-h-full items-center justify-center px-5 py-12 text-[var(--t1)]">
    <div className="flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">{icon}</span>
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-[15px] text-[var(--t2)]">{description}</p>
      </div>
      <Link to={homePath} onClick={onHomeClick} className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--marca)] px-[14px] text-[13px] font-semibold text-[var(--lado-activo)] hover:bg-[var(--marca-h)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] md:min-h-[35px]">
        {t("errorPage.home")}
      </Link>
    </div>
  </div>;
}
