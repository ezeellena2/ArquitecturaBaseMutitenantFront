import type { DirectoryEntryRow } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";
import { publicSiteHost, publicSiteUrl } from "@/tenancy/publicSite";

/** Landing y Directorio: solo la proyección publicada, sin consultar datos de la sesión. */
export function CompanyCard({ company }: { company: DirectoryEntryRow }) {
  return <a href={publicSiteUrl(company.slug)}
    className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-[var(--borde)] bg-[var(--lado-activo)] p-4 text-[var(--t1)] no-underline hover:border-[var(--borde2)] hover:shadow-[var(--sombra-directorio)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] md:gap-2.5 md:p-[22px]">
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--marca-t)] font-bold text-[var(--marca-tx)]">
        {company.logoUrl ? <img src={company.logoUrl} alt="" className="size-full object-contain" /> : initials(company.name)}
      </span>
      <b className="min-w-0 break-words text-[16px] font-semibold md:text-[17px]">{company.name}</b>
    </span>
    {company.description ? <p className="m-0 break-words text-[14.5px] leading-[1.5] text-[var(--t2)] md:text-[15px]">{company.description}</p> : null}
    <span className="break-all text-[14px] font-medium text-[var(--marca-tx)]">{publicSiteHost(company.slug)}</span>
  </a>;
}
