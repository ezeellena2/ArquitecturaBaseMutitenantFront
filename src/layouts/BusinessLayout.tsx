import type { ReactNode } from "react";
import { OrganizationUnavailablePage } from "@/areas/public/errors/pages/OrganizationUnavailablePage";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { useNavigation } from "./navigation/useNavigation";
import { activeOrganization, unavailableCodeOf } from "@/tenancy/access";

export function BusinessLayout({ children }: { children?: ReactNode }) {
  const navigation = useNavigation("business");
  const { data: account } = useCurrentUser();
  const organization = activeOrganization(account);
  const unavailableCode = organization ? unavailableCodeOf(organization.status) : null;
  if (organization && unavailableCode) {
    return <OrganizationUnavailablePage code={unavailableCode} organizationName={organization.name} organizationId={organization.id} />;
  }
  return <PrivateLayoutFrame navigation={navigation} scope="business">{children}</PrivateLayoutFrame>;
}
