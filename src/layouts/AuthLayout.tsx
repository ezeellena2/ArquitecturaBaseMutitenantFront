import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import i18n, { changeCulture } from "@/shared/i18n";
import { nativeLanguageName } from "@/shared/format/cultureName";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { BrandMark } from "@/shared/ui/BrandMark";

type AuthLayoutProps = { access: "consumer" | "business"; children: ReactNode; brandPanel?: "content" | "blank" };

export function AuthLayout({ access, children, brandPanel = "content" }: AuthLayoutProps) {
  const { t } = useTranslation("auth");
  const { data: referenceData } = useReferenceData();
  const cultures = referenceData?.cultures.filter((culture) => culture.isEnabled) ?? [];
  const panelKey = access === "consumer" ? "person" : "business";
  const pointIcons = access === "consumer"
    ? [
      <><circle cx="12" cy="8" r="3.75" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
      <><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M3 21h18" /><path d="M8 8h3" /><path d="M8 12h3" /><path d="M8 16h3" /></>,
      <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
    ]
    : [
      <><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M3 21h18" /><path d="M8 8h3" /><path d="M8 12h3" /><path d="M8 16h3" /></>,
      <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4" /><path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" /></>,
      <><path d="M9 3.5h6v3H9z" /><path d="M15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
    ];

  return <div className="grid min-h-screen grid-cols-1 bg-[var(--lado-activo)] text-[var(--t1)] md:grid-cols-2">
    <div className="flex min-h-screen flex-col px-4 pb-4 pt-[18px] md:px-10 md:pb-[22px] md:pt-6">
      <Link to="/" className="inline-flex items-center gap-2.5 self-start text-[15px] font-bold tracking-tight text-[var(--t1)] no-underline">
        <BrandMark />
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
      {brandPanel === "content" ? <>
      <span className="self-start rounded-full bg-[var(--lado-activo)]/15 px-3 py-1.5 text-[13px] font-semibold">{t(`panel.${panelKey}.kicker`)}</span>
      <h2 className="max-w-[520px] text-[32px] leading-[1.15] font-bold tracking-[-0.025em]">{t(`panel.${panelKey}.heading`)}</h2>
      <p className="max-w-[500px] text-[15px] leading-[1.6] text-[var(--lado-activo)]/85">{t("panel.intro")}</p>
      <ul className="mt-2 flex max-w-[500px] flex-col gap-[18px] text-sm font-normal text-[var(--lado-activo)]/90">
        {(["first", "second", "third"] as const).map((point, index) => {
          return <li key={point} className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--lado-activo)]/15"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{pointIcons[index]}</svg></span>
          <span>{t(`panel.${panelKey}.points.${point}`)}</span>
        </li>; })}
      </ul>
      </> : null}
    </aside>
  </div>;
}
