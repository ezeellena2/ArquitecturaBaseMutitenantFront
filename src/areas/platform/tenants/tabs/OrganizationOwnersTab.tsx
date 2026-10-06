import { useTranslation } from "react-i18next";
import type { PlatformTenantDetailResponse } from "@/shared/api/types";
import { DataTable } from "@/shared/ui/DataTable";
import { Surface } from "@/shared/ui/Surface";
import { createOrganizationOwnerColumns, organizationOwnerPhoneRow, organizationOwners } from "../columns";

export function OrganizationOwnersTab({ organization }: { organization: PlatformTenantDetailResponse }) {
  const { t } = useTranslation("platformTenants");
  return <Surface className="overflow-hidden" phoneFlush>
    <DataTable columns={createOrganizationOwnerColumns(t)} rows={organizationOwners(organization)} rowKey={(row) => row.id}
      mobileRow={(row) => organizationOwnerPhoneRow(row, t)}
      emptyTitle={t("detail.ownersEmpty")} />
  </Surface>;
}
