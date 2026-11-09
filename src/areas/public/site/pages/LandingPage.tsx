import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Check, Search, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { Input } from "@/shared/ui/input";
import { loginPathOf } from "@/tenancy/access";
import { directoryQueryKey, fetchDirectory, type DirectoryQuery } from "../api/directory";
import { CompanyCard } from "../components/CompanyCard";

const wrap = "mx-auto max-w-320 px-4 md:px-10";
const primary = "relative inline-flex min-h-10 items-center justify-center rounded-[0.625rem] bg-[var(--marca)] px-6 text-[0.9375rem] font-semibold text-[var(--superficie)] after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']";
const secondaryLarge = "relative inline-flex min-h-10 items-center justify-center rounded-[0.625rem] border border-[var(--t3)] bg-[var(--superficie)] px-6 text-[0.9375rem] font-semibold text-[var(--t1)] after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']";
const onBrand = "relative inline-flex min-h-10 items-center justify-center rounded-[0.625rem] bg-[var(--superficie)] px-6 text-[0.9375rem] font-semibold text-[var(--marca-tx)] after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-[0.625rem] border border-[var(--t3)] bg-[var(--superficie)] px-6 text-[0.9375rem] font-semibold text-[var(--marca)]";
const previewQuery: DirectoryQuery = { page: 1, pageSize: 10 };

function PublishedCompanies() {
  const { t } = useTranslation("site");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const directory = useQuery({
    queryKey: directoryQueryKey(previewQuery), queryFn: () => fetchDirectory(previewQuery), meta: { silent: true },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = search.trim();
    const params = new URLSearchParams();
    if (text) params.set("search", text);
    void navigate(`/empresas${text ? `?${params.toString()}` : ""}`);
  }

  const companies = directory.data?.items.slice(0, 3) ?? [];
  return <section id="empresas" className="py-12 md:py-20" aria-labelledby="landing-companies-title"><div className={wrap}>
    <h2 id="landing-companies-title" className="text-center text-[1.75rem] leading-[1.15] font-bold tracking-[-0.025em] md:text-[2.25rem]">{t("landing.companies.title")}</h2>
    <form role="search" aria-label={t("landing.companies.search")} onSubmit={submit} className="mt-5 flex justify-center md:mt-7">
      <div className="relative w-full md:w-105">
        <Search aria-hidden="true" strokeWidth={1.75} className="size-4 pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--t3)]" />
        <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
          aria-label={t("landing.companies.search")} placeholder={t("landing.companies.search")}
          className="h-11 rounded-[0.625rem] pl-10 pr-3.5 text-[0.9375rem] max-md:h-11 max-md:rounded-[0.625rem] max-md:pl-10 max-md:text-[0.9375rem]" />
      </div>
      <button type="submit" tabIndex={-1} className="sr-only">{t("common:actions.search")}</button>
    </form>
    {directory.isPending ? <p role="status" className="py-12 text-center text-[var(--t2)]">{t("common:states.loading")}</p>
      : directory.isError ? <div className="flex flex-col items-center gap-3 px-6 py-12">
        <FormError message={apiErrorMessage(directory.error, t)} />
        <Button variant="outline" className="max-md:h-11" onClick={() => { void directory.refetch(); }} disabled={directory.isFetching}>{t("common:actions.retry")}</Button>
      </div>
        : companies.length === 0 ? <div className="flex flex-col items-center gap-3 px-6 py-12 text-center"><strong className="text-[1rem] font-semibold text-[var(--t1)]">{t("landing.companies.empty")}</strong></div>
          : <>
            <div className="mt-4 grid gap-3 md:mt-9 md:grid-cols-3 md:gap-5">{companies.map((company) => <CompanyCard key={company.slug} company={company} />)}</div>
            <div className="mt-5 flex justify-center md:mt-7"><Link to="/empresas" className="relative inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--marca-tx)] no-underline after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">{t("landing.companies.viewAll")}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          </>}
  </div></section>;
}

function ProfilePreview() {
  const { t } = useTranslation("site");
  return <div aria-hidden="true" className="mx-auto flex w-full max-w-72.5 flex-col gap-3 rounded-[1.25rem] border border-[var(--borde)] bg-[var(--superficie)] p-4.5 md:max-w-none">
    <div className="flex items-center gap-3 border-b border-[var(--borde)] px-1.5 pb-3 pt-1.5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-base font-bold text-[var(--superficie)]">{t("landing.preview.initial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[0.9375rem] font-semibold">{t("landing.preview.name")}</span><span className="text-[0.6875rem] text-[var(--t3)] md:text-[0.8125rem]">{t("landing.preview.email")}</span></span></div>
    <div className="pl-3.5 text-[0.8125rem] font-semibold text-[var(--t3)]">{t("landing.preview.profiles")}</div>
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[0.5625rem] bg-[var(--s3)] text-xs font-semibold md:size-8">{t("landing.preview.personalInitial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[0.8125rem] font-semibold md:text-[0.875rem]">{t("landing.preview.personal")}</span><span className="text-[0.75rem] text-[var(--t3)] md:text-[0.8125rem]">{t("landing.preview.personalDetail")}</span></span></div>
    <div className="flex items-center gap-3 rounded-xl bg-[var(--marca-t)] px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[0.5625rem] bg-[var(--superficie)] text-xs font-semibold text-[var(--marca-tx)] md:size-8">{t("landing.preview.groupInitial")}</span><span className="flex min-w-0 flex-1 flex-col leading-[1.3]"><span className="text-[0.8125rem] font-semibold md:text-[0.875rem]">{t("landing.preview.group")}</span><span className="text-[0.75rem] text-[var(--t3)] md:text-[0.8125rem]">{t("landing.preview.groupDetail")}</span></span><Check className="size-4 shrink-0 text-[var(--marca-tx)]" /></div>
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[0.5625rem] bg-[var(--s3)] text-xs font-semibold md:size-8">{t("landing.preview.otherInitial")}</span><span className="flex min-w-0 flex-col leading-[1.3]"><span className="text-[0.8125rem] font-semibold md:text-[0.875rem]">{t("landing.preview.other")}</span><span className="text-[0.75rem] text-[var(--t3)] md:text-[0.8125rem]">{t("landing.preview.otherDetail")}</span></span></div>
  </div>;
}

function CheckItem({ children }: { children: ReactNode }) {
  return <li className="flex items-start gap-2.5 text-[var(--t2)]"><Check strokeWidth={2.25} className="size-4 mt-1 shrink-0 text-[var(--ok)]" /><span>{children}</span></li>;
}

export function LandingPage() {
  const { t } = useTranslation("site");
  return <>
    <section className="bg-[radial-gradient(ellipse_at_85%_10%,var(--lado),transparent_55%)] py-10 md:py-22 md:pb-18"><div className={`${wrap} flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-16`}>
      <div><h1 className="mt-4.5 text-[2.25rem] leading-[1.08] font-bold tracking-[-0.03em] md:text-[3.375rem]">{t("landing.hero.line1")}{" "}<br /><span className="text-[var(--marca)]">{t("landing.hero.line2")}</span></h1><p className="mt-5 max-w-130 text-[1.0625rem] text-[var(--t2)] md:text-[1.1875rem]">{t("landing.hero.detail")}</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/registro" className={`${primary} w-full md:w-auto`}>{t("landing.createAccount")}</Link><Link to="/registro/empresa" className={`${secondaryLarge} w-full md:w-auto`}>{t("landing.registerBusiness")}</Link></div></div>
      <ProfilePreview />
    </div></section>
    <section id="personas" className="bg-[var(--fondo)] py-12 md:py-20"><div className={wrap}>
      <h2 className="text-center text-[1.75rem] leading-[1.15] font-bold tracking-[-0.025em] md:text-[2.25rem]">{t("landing.sides.title")}</h2><p className="mx-auto mt-3 max-w-155 text-center text-[1.0625rem] text-[var(--t2)]">{t("landing.sides.detail")}</p>
      <div className="mt-7 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-4 rounded-[1.125rem] border border-[var(--borde)] bg-[var(--superficie)] p-6 md:p-8"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--marca-t)] text-[var(--marca-tx)]"><UserRound className="size-5" strokeWidth={1.75} /></span><h3 className="text-[1.375rem] font-bold tracking-[-0.015em]">{t("landing.sides.people.title")}</h3><ul className="flex flex-col gap-3"><CheckItem>{t("landing.sides.people.point1")}</CheckItem><CheckItem>{t("landing.sides.people.point2")}</CheckItem></ul><div className="mt-auto flex flex-wrap gap-2.5 pt-4"><Link to="/registro" className={secondary}>{t("landing.createAccount")}</Link><Link to="/login" className={secondary}>{t("landing.login")}</Link></div></div>
        <div id="organizaciones" className="flex flex-col gap-4 rounded-[1.125rem] border border-[var(--borde)] bg-[var(--superficie)] p-6 md:p-8"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--marca-t)] text-[var(--marca-tx)]"><Building2 className="size-5" strokeWidth={1.75} /></span><h3 className="text-[1.375rem] font-bold tracking-[-0.015em]">{t("landing.sides.business.title")}</h3><ul className="flex flex-col gap-3"><CheckItem>{t("landing.sides.business.point1")}</CheckItem><CheckItem>{t("landing.sides.business.point2")}</CheckItem><CheckItem>{t("landing.sides.business.point3")}</CheckItem></ul><div className="mt-auto flex flex-wrap gap-2.5 pt-4"><Link to="/registro/empresa" className={secondary}>{t("landing.registerBusiness")}</Link><Link to={loginPathOf("business")} className={secondary}>{t("navigation.businessLogin")}</Link></div></div>
      </div>
    </div></section>
    <PublishedCompanies />
    <section id="empezar" className="py-12 md:py-20"><div className={wrap}><h2 className="text-center text-[1.75rem] leading-[1.15] font-bold tracking-[-0.025em] md:text-[2.25rem]">{t("landing.steps.title")}</h2><div className="mt-7 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">{([1, 2, 3] as const).map((number) => <div key={number} className="flex flex-col gap-2.5"><span className="flex size-9 items-center justify-center rounded-full bg-[var(--marca)] font-bold text-[var(--superficie)]">{number}</span><h3 className="mt-1.5 text-[1.1875rem] font-bold">{t(`landing.steps.${number}.title`)}</h3><p className="text-[var(--t2)]">{t(`landing.steps.${number}.detail`)}</p></div>)}</div></div></section>
    <section className="mx-4 mb-10 rounded-[1.5rem] bg-[var(--marca)] px-5 py-9 text-center text-[var(--superficie)] md:mx-10 md:mb-20 md:p-16"><h2 className="text-[1.75rem] font-bold tracking-[-0.025em] md:text-[2.375rem]">{t("landing.final.title")}</h2><p className="mb-7 mt-3 text-[1.125rem] text-[var(--superficie)]/85">{t("landing.final.detail")}</p><div className="flex flex-wrap justify-center gap-3"><Link to="/registro/empresa" className={onBrand}>{t("landing.registerBusiness")}</Link><Link to="/registro" className={onBrand}>{t("landing.createAccount")}</Link></div></section>
  </>;
}

