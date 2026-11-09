import type { DirectoryEntryRow } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";
import { publicSiteHost, publicSiteUrl } from "@/tenancy/publicSite";

/** Landing y Directorio: solo la proyección publicada, sin consultar datos de la sesión. */
export function CompanyCard({ company }: { company: DirectoryEntryRow }) {
  return <a href={publicSiteUrl(company.slug)}
    className="flex min-w-0 flex-col gap-2 rounded-[1rem] border border-[var(--borde)] bg-[var(--superficie)] p-4 text-[var(--t1)] no-underline hover:border-[var(--borde2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] md:gap-2.5 md:p-5.5">
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--marca-t)] font-bold text-[var(--marca-tx)]">
        {company.logoUrl ? <img src={company.logoUrl} alt="" className="size-full object-contain" /> : initials(company.name)}
      </span>
      <b className="min-w-0 break-words text-[1rem] font-semibold md:text-[1.0625rem]">{company.name}</b>
    </span>
    {company.description ? <p className="m-0 break-words text-[0.90625rem] leading-[1.5] text-[var(--t2)] md:text-[0.9375rem]">{company.description}</p> : null}
    <span className="break-all text-[0.875rem] font-medium text-[var(--marca-tx)]">{publicSiteHost(company.slug)}</span>
  </a>;
}
