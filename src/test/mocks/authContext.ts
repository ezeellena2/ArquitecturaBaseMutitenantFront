import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { currentUsers, type CurrentUserFixture } from "./currentUsers";

export function fixtureAuth(as: CurrentUserFixture): AuthContextProps {
  const fixture = currentUsers[as];
  const user = {
    access_token: `test-${as}`,
    profile: { sub: fixture.id, access: fixture.access, tenant_id: fixture.activeTenantId },
  } as unknown as User;
  return {
    isAuthenticated: true,
    isLoading: false,
    user,
    signinSilent: async () => user,
    signinRedirect: async () => {},
    signoutRedirect: async () => {},
  } as unknown as AuthContextProps;
}
