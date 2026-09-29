import type { ReactNode } from "react";
import { Building2, ClipboardList, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import i18n, { changeCulture } from "@/shared/i18n";
import { nativeLanguageName } from "@/shared/format/cultureName";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";

type AuthLayoutProps = { access: "consumer" | "business"; children: ReactNode };

export function AuthLayout({ access, children }: AuthLayoutProps) {
  const { t } = useTranslation("auth");
  const { data: referenceData } = useReferenceData();
  const cultures = referenceData?.cultures.filter((culture) => culture.isEnabled) ?? [];
  const panelKey = access === "consumer" ? "person" : "business";
  const pointIcons = access === "consumer"
    ? [UserRound, Building2, LockKeyhole]
    : [Building2, UsersRound, ClipboardList];

  return <div className="grid min-h-screen grid-cols-1 bg-[var(--lado-activo)] text-[var(--t1)] md:grid-cols-2">
    <div className="flex min-h-screen flex-col px-4 pb-4 pt-[18px] md:px-10 md:pb-[22px] md:pt-6">
      <Link to="/" className="inline-flex items-center gap-2.5 self-start text-[15px] font-bold tracking-tight text-[var(--t1)] no-underline">
        <span aria-hidden="true" className="relative size-8 shrink-0 rounded-[9px] bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] after:absolute after:inset-2 after:-rotate-45 after:rounded-[3px] after:border-[2.5px] after:border-[var(--lado-activo)] after:border-r-transparent after:content-['']" />
        {t("brand")}
      </Link>
      <main className="flex min-h-0 flex-1 items-start justify-center pt-7 md:items-center md:pt-0">
        <div className="flex w-full max-w-[380px] flex-col gap-4">{children}</div>
      </main>
      <footer className="flex flex-col items-start gap-1.5 text-[13px] text-[var(--t3)] md:flex-row md:items-center md:justify-between md:gap-4">
        <span className="inline-flex flex-wrap items-center gap-1">
          {t("footer.language")}{":"}
          {cultures.map((culture, index) => <span key={culture.code} className="inline-flex items-center gap-1">
            {index > 0 ? <span aria-hidden="true">{"·"}</span> : null}
            <button type="button" onClick={() => void changeCulture(culture.code)} aria-pressed={i18n.language === culture.code} className={`text-[13px] ${i18n.language === culture.code ? "font-semibold text-[var(--t1)]" : "text-[var(--t2)] hover:underline"}`}>
              {nativeLanguageName(culture.code, culture.languageCode)}
            </button>
          </span>)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Link to="/terminos" className="text-[var(--t2)] hover:underline">{t("footer.terms")}</Link>
          <span aria-hidden="true">{"·"}</span>
          <Link to="/privacidad" className="text-[var(--t2)] hover:underline">{t("footer.privacy")}</Link>
        </span>
      </footer>
    </div>
    <aside data-testid="auth-brand-panel" aria-hidden="true" className="auth-brand-panel relative hidden flex-col justify-center gap-5 overflow-hidden px-14 text-[var(--lado-activo)] md:flex">
      <span className="self-start rounded-full bg-[var(--lado-activo)]/15 px-3 py-1.5 text-[13px] font-semibold">{t(`panel.${panelKey}.kicker`)}</span>
      <h2 className="max-w-[520px] text-[32px] leading-[1.15] font-bold tracking-[-0.025em]">{t(`panel.${panelKey}.heading`)}</h2>
      <p className="max-w-[500px] text-[15px] leading-[1.6] text-[var(--lado-activo)]/85">{t("panel.intro")}</p>
      <ul className="mt-2 flex max-w-[500px] flex-col gap-[18px] text-sm">
        {(["first", "second", "third"] as const).map((point, index) => {
          const Icon = pointIcons[index];
          return <li key={point} className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--lado-activo)]/15"><Icon size={20} strokeWidth={1.75} /></span>
          <span>{t(`panel.${panelKey}.points.${point}`)}</span>
        </li>; })}
      </ul>
    </aside>
  </div>;
}
