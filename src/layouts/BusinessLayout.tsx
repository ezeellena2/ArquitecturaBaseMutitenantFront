import type { ReactNode } from "react";
import { OrganizationUnavailablePage, type UnavailableCode } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { businessNavigation } from "./navigation/business";

const unavailableCodeByStatus: Record<string, UnavailableCode> = {
  Suspended: "Tenancy.Tenant.Suspended",
  PendingApproval: "Tenancy.Tenant.PendingApproval",
  Closed: "Tenancy.Tenant.Closed",
};

export function BusinessLayout({ children }: { children?: ReactNode }) {
  const { data: account } = useCurrentUser();
  const activeOrganization = account?.organizations.find((organization) => organization.id === account.activeTenantId);
  const unavailableCode = activeOrganization && unavailableCodeByStatus[activeOrganization.status];
  if (activeOrganization && unavailableCode) {
    return <OrganizationUnavailablePage code={unavailableCode} organizationName={activeOrganization.name} organizationId={activeOrganization.id} />;
  }
  return <PrivateLayoutFrame navigation={businessNavigation} scope="business">{children}</PrivateLayoutFrame>;
}
