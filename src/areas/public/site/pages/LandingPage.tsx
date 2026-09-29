import { Building2, Check, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const wrap = "mx-auto max-w-[1280px] px-4 md:px-10";
const primary = "inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--marca)] px-6 text-[15px] font-semibold text-[var(--lado-activo)]";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[var(--t3)] bg-[var(--lado-activo)] px-6 text-[15px] font-semibold text-[var(--marca)]";

function ProfilePreview() {
  const { t } = useTranslation("site");
  return <div aria-hidden="true" className="mx-auto flex w-full max-w-[290px] flex-col gap-3 rounded-[20px] border border-[var(--borde)] bg-[var(--lado-activo)] p-[18px] shadow-[var(--shadow-card)] md:max-w-none">
    <div className="flex items-center gap-3 border-b border-[var(--borde)] px-1.5 pb-3 pt-1.5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] text-base font-bold text-[var(--lado-activo)]">{t("landing.preview.initial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[15px] font-semibold">{t("landing.preview.name")}</span><span className="text-[11px] text-[var(--t3)] md:text-[13px]">{t("landing.preview.email")}</span></span></div>
    <div className="pl-3.5 text-[13px] font-semibold text-[var(--t3)]">{t("landing.preview.profiles")}</div>
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--s3)] text-xs font-semibold md:size-8">{t("landing.preview.personalInitial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[13px] font-semibold md:text-[14px]">{t("landing.preview.personal")}</span><span className="text-[12px] text-[var(--t3)] md:text-[13px]">{t("landing.preview.personalDetail")}</span></span></div>
    <div className="flex items-center gap-3 rounded-xl bg-[var(--marca-t)] px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--lado-activo)] text-xs font-semibold text-[var(--marca-tx)] md:size-8">{t("landing.preview.groupInitial")}</span><span className="flex min-w-0 flex-1 flex-col leading-[1.3]"><span className="text-[13px] font-semibold md:text-[14px]">{t("landing.preview.group")}</span><span className="text-[12px] text-[var(--t3)] md:text-[13px]">{t("landing.preview.groupDetail")}</span></span><Check size={16} className="shrink-0 text-[var(--marca-tx)]" /></div>
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--s3)] text-xs font-semibold md:size-8">{t("landing.preview.otherInitial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[13px] font-semibold md:text-[14px]">{t("landing.preview.other")}</span><span className="text-[12px] text-[var(--t3)] md:text-[13px]">{t("landing.preview.otherDetail")}</span></span></div>
  </div>;
}

function CheckItem({ children }: { children: ReactNode }) {
  return <li className="flex items-start gap-2.5 text-[var(--t2)]"><Check size={16} strokeWidth={2.25} className="mt-1 shrink-0 text-[var(--ok)]" /><span>{children}</span></li>;
}

export function LandingPage() {
  const { t } = useTranslation("site");
  return <>
    <section className="bg-[radial-gradient(ellipse_at_85%_10%,var(--lado),transparent_55%)] py-10 md:py-[88px] md:pb-[72px]"><div className={`${wrap} flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-16`}>
      <div><span className="inline-flex rounded-full bg-[var(--marca-t)] px-3 py-1.5 text-[13px] font-semibold text-[var(--marca-tx)]">{t("landing.hero.kicker")}</span><h1 className="mt-[18px] text-[36px] leading-[1.08] font-bold tracking-[-0.03em] md:text-[54px]">{t("landing.hero.line1")}{" "}<br /><span className="text-[var(--marca)]">{t("landing.hero.line2")}</span></h1><p className="mt-5 max-w-[520px] text-[17px] text-[var(--t2)] md:text-[19px]">{t("landing.hero.detail")}</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/registro" className={`${primary} w-full md:w-auto`}>{t("landing.createAccount")}</Link></div></div>
      <ProfilePreview />
    </div></section>
    <section id="personas" className="bg-[var(--fondo)] py-12 md:py-20"><div className={wrap}>
      <h2 className="text-center text-[28px] leading-[1.15] font-bold tracking-[-0.025em] md:text-[36px]">{t("landing.sides.title")}</h2><p className="mx-auto mt-3 max-w-[620px] text-center text-[17px] text-[var(--t2)]">{t("landing.sides.detail")}</p>
      <div className="mt-7 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-4 rounded-[18px] border border-[var(--borde)] bg-[var(--lado-activo)] p-6 md:p-8"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--marca-t)] text-[var(--marca-tx)]"><UserRound size={20} strokeWidth={1.75} /></span><h3 className="text-[22px] font-bold tracking-[-0.015em]">{t("landing.sides.people.title")}</h3><ul className="flex flex-col gap-3"><CheckItem>{t("landing.sides.people.point1")}</CheckItem><CheckItem>{t("landing.sides.people.point2")}</CheckItem></ul><div className="mt-auto flex flex-wrap gap-2.5 pt-4"><Link to="/registro" className={secondary}>{t("landing.createAccount")}</Link><Link to="/login" className={secondary}>{t("landing.login")}</Link></div></div>
        <div id="organizaciones" className="flex flex-col gap-4 rounded-[18px] border border-[var(--borde)] bg-[var(--lado-activo)] p-6 md:p-8"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--marca-t)] text-[var(--marca-tx)]"><Building2 size={20} strokeWidth={1.75} /></span><h3 className="text-[22px] font-bold tracking-[-0.015em]">{t("landing.sides.business.title")}</h3><ul className="flex flex-col gap-3"><CheckItem>{t("landing.sides.business.point1")}</CheckItem><CheckItem>{t("landing.sides.business.point2")}</CheckItem><CheckItem>{t("landing.sides.business.point3")}</CheckItem></ul><div className="mt-auto flex flex-wrap gap-2.5 pt-4"><Link to="/login/empresa" className={secondary}>{t("navigation.businessLogin")}</Link></div></div>
      </div>
    </div></section>
    <section id="empezar" className="py-12 md:py-20"><div className={wrap}><h2 className="text-center text-[28px] leading-[1.15] font-bold tracking-[-0.025em] md:text-[36px]">{t("landing.steps.title")}</h2><div className="mt-7 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">{([1, 2, 3] as const).map((number) => <div key={number} className="flex flex-col gap-2.5"><span className="flex size-9 items-center justify-center rounded-full bg-[var(--marca)] font-bold text-[var(--lado-activo)]">{number}</span><h3 className="mt-1.5 text-[19px] font-bold">{t(`landing.steps.${number}.title`)}</h3><p className="text-[var(--t2)]">{t(`landing.steps.${number}.detail`)}</p></div>)}</div></div></section>
    <section className="mx-4 mb-10 rounded-[24px] bg-[linear-gradient(150deg,var(--marca),var(--marca-h))] px-5 py-9 text-center text-[var(--lado-activo)] md:mx-10 md:mb-20 md:p-16"><h2 className="text-[28px] font-bold tracking-[-0.025em] md:text-[38px]">{t("landing.final.title")}</h2><p className="mb-7 mt-3 text-[18px] text-[var(--lado-activo)]/85">{t("landing.final.detail")}</p><div className="flex flex-wrap justify-center gap-3"><Link to="/registro" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--lado-activo)] px-6 text-[15px] font-semibold text-[var(--marca-tx)]">{t("landing.createAccount")}</Link></div></section>
  </>;
}

