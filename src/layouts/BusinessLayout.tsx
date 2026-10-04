import type { ReactNode } from "react";
import { OrganizationUnavailablePage } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { businessNavigation } from "./navigation/business";
import { activeOrganization, unavailableCodeOf } from "@/tenancy/access";

export function BusinessLayout({ children }: { children?: ReactNode }) {
  const { data: account } = useCurrentUser();
  const organization = activeOrganization(account);
  const unavailableCode = organization ? unavailableCodeOf(organization.status) : null;
  if (organization && unavailableCode) {
    return <OrganizationUnavailablePage code={unavailableCode} organizationName={organization.name} organizationId={organization.id} />;
  }
  return <PrivateLayoutFrame navigation={businessNavigation} scope="business">{children}</PrivateLayoutFrame>;
}
