import { InMemoryWebStorage, WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";
import { authIssuer } from "./issuer";

// El issuer pertenece al dominio principal; las llamadas de datos usan el origen de la pestaña.
export function createAuthConfig(origin = globalThis.location.origin): UserManagerSettings {
  return {
    authority: authIssuer,
    metadataUrl: `${origin}/.well-known/openid-configuration`,
    metadataSeed: {
      // Discovery se lee sin CORS en el origen propio; la cookie del navegador pertenece al principal.
      authorization_endpoint: new URL("/connect/authorize", authIssuer).href,
      end_session_endpoint: new URL("/connect/logout", authIssuer).href,
      token_endpoint: `${origin}/connect/token`,
      userinfo_endpoint: `${origin}/connect/userinfo`,
      revocation_endpoint: `${origin}/connect/revoke`,
    },
    client_id: "web",
    redirect_uri: `${origin}/auth/callback`,
    post_logout_redirect_uri: `${origin}/`,
    silent_redirect_uri: `${origin}/silent-renew.html`,
    response_type: "code",
    scope: "openid profile email offline_access api",
    userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
    stateStore: new WebStorageStateStore({ store: globalThis.sessionStorage }),
    automaticSilentRenew: false,
    accessTokenExpiringNotificationTimeInSeconds: 60,
  };
}

export const authConfig = createAuthConfig();
