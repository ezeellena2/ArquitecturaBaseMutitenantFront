import { InMemoryWebStorage, WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";

// El issuer pertenece al dominio principal; las llamadas de datos usan el origen de la pestaña.
const issuer = import.meta.env.VITE_AUTH_ISSUER ?? "https://localhost:5174/";
const origin = globalThis.location.origin;

export const authConfig: UserManagerSettings = {
  authority: issuer,
  metadataUrl: `${origin}/.well-known/openid-configuration`,
  metadataSeed: {
    token_endpoint: `${origin}/connect/token`,
    userinfo_endpoint: `${origin}/connect/userinfo`,
    revocation_endpoint: `${origin}/connect/revocation`,
  },
  client_id: "web",
  redirect_uri: `${origin}/auth/callback`,
  post_logout_redirect_uri: `${origin}/login`,
  silent_redirect_uri: `${origin}/silent-renew.html`,
  response_type: "code",
  scope: "openid profile email offline_access api",
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  stateStore: new WebStorageStateStore({ store: globalThis.sessionStorage }),
  automaticSilentRenew: false,
  accessTokenExpiringNotificationTimeInSeconds: 60,
};
