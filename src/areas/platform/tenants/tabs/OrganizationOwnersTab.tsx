import { useTranslation } from "react-i18next";
import type { PlatformTenantDetailResponse } from "@/shared/api/types";
import { usePagination } from "@/shared/hooks/usePagination";
import { DataTable } from "@/shared/ui/DataTable";
import { Surface } from "@/shared/ui/Surface";
import { sortRows } from "@/shared/ui/tableSort";
import { createOrganizationOwnerColumns, organizationOwnerPhoneRow, organizationOwners } from "../columns";

/// Los Dueños llegan enteros con la ficha: ordenan en el navegador, con el orden en la dirección (264).
export function OrganizationOwnersTab({ organization }: { organization: PlatformTenantDetailResponse }) {
  const { t } = useTranslation("platformTenants");
  const { sort, setSort } = usePagination({ prefix: "duenos." });
  const columns = createOrganizationOwnerColumns(t);
  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={columns} rows={sortRows(organizationOwners(organization), columns, sort)} rowKey={(row) => row.id}
      mobileRow={(row) => organizationOwnerPhoneRow(row, t)} sort={sort} onSortChange={setSort}
      emptyTitle={t("detail.ownersEmpty")} />
  </Surface>;
}
