import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/layouts/SiteLayout";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { Input } from "@/shared/ui/input";
import { SearchIcon } from "@/shared/ui/icons";
import { Pagination } from "@/shared/ui/Pagination";
import { directoryQueryKey, fetchDirectory, type DirectoryQuery } from "../api/directory";
import { CompanyCard } from "../components/CompanyCard";

const filterKeys = [] as const;

export function DirectoryPage() {
  const { t } = useTranslation("site");
  const phone = useMediaQuery("(max-width: 767px)");
  const { pagination, query, result: directory, paginationProps } = usePagedQuery({
    filterKeys, toQuery: (page): DirectoryQuery => ({ ...page }),
    queryKey: directoryQueryKey, queryFn: fetchDirectory, meta: { silent: true },
  });
  const companies = directory.data?.items ?? [];
  const hasSearch = Boolean(query.search?.trim());

  return <SiteLayout variant="directory"><div className="py-6 md:py-7">
    <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 md:gap-4 md:px-10">
      <h1 className="m-0 text-[26px] leading-[1.25] font-bold tracking-[-0.02em] md:text-[30px]">{t("directory.title")}</h1>
      <div role="search" aria-label={t("directory.searchLabel")}
        className="flex rounded-xl border border-[var(--borde)] bg-[var(--lado-activo)] px-3 py-2.5 max-md:border-0 max-md:bg-transparent max-md:p-0">
        <div className="relative w-full md:w-[360px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--t3)] max-md:left-3 max-md:size-4" />
          <Input type="search" value={pagination.search ?? ""} onChange={(event) => pagination.setSearch(event.target.value)}
            aria-label={t("directory.search")} placeholder={t("directory.search")}
            className="h-8 rounded-[8px] border-[var(--borde)] bg-[var(--s2)] pl-8 text-[13px] max-md:h-11 max-md:rounded-xl max-md:bg-[var(--lado-activo)] max-md:pl-[38px] max-md:text-[15px]" />
        </div>
      </div>
      {directory.isPending ? <p role="status" className="py-12 text-center text-[var(--t2)]">{t("common:states.loading")}</p>
        : directory.isError ? <div className="flex flex-col items-center gap-3 px-6 py-12">
          <FormError message={apiErrorMessage(directory.error, t)} />
          <Button variant="outline" className="max-md:h-11" onClick={() => { void directory.refetch(); }} disabled={directory.isFetching}>{t("common:actions.retry")}</Button>
        </div>
          : companies.length === 0 ? <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" aria-busy={directory.isFetching}>
            <strong className="text-[16px] font-semibold text-[var(--t1)]">{t(hasSearch ? "directory.noResults" : "landing.companies.empty")}</strong>
            {hasSearch ? <Button variant="outline" className="max-md:h-11" onClick={() => pagination.setSearch("")}>{t("directory.clearSearch")}</Button> : null}
          </div>
            : <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5" aria-busy={directory.isFetching}>{companies.map((company) => <CompanyCard key={company.slug} company={company} />)}</div>
              {paginationProps ? <Pagination {...paginationProps} variant="web" mobile={phone} /> : null}
            </>}
    </div>
  </div></SiteLayout>;
}
