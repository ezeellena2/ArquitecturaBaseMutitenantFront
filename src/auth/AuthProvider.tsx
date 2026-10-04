import { useLayoutEffect, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth, type AuthContextProps } from "react-oidc-context";
import { configureHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { authConfig } from "./authConfig";
import { rememberExpiredSessionNotice } from "./sessionExpiredNotice";
import { rememberRecoveryAccess } from "./recoveryAccess";
import { accessOfPath, loginPathOf, parseAccess } from "@/tenancy/access";

let session: AuthContextProps | undefined;

// El puente está listo antes de la primera consulta que hagan los hijos.
const httpClientOptions = {
  getAccessToken: () => session?.user?.access_token,
  renewAccessToken: async () => (await session?.signinSilent())?.access_token,
  onSessionExpired: async () => {
    const returnUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
    // La puerta de empresa si la sesión era de empresa o si estaba en una ruta de empresa; si no, la de la persona.
    const sessionAccess = parseAccess(session?.user?.profile.access);
    const loginPath = loginPathOf(sessionAccess === "business" ? sessionAccess : accessOfPath(globalThis.location.pathname));
    const query = new URLSearchParams({ returnUrl, session: "expired" });

    rememberExpiredSessionNotice();
    queryClient.clear();
    try {
      await session?.removeUser();
    } finally {
      globalThis.location.assign(`${loginPath}?${query}`);
    }
  },
};
configureHttpClient(httpClientOptions);

function onSigninCallback(): void {
  globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
}

function HttpClientBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useLayoutEffect(() => {
    session = auth;
    if (auth.isAuthenticated) rememberRecoveryAccess(auth.user?.profile.access);
    configureHttpClient(httpClientOptions);
    return () => { session = undefined; };
  }, [auth]);

  return <>{children}</>;
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider {...authConfig} onSigninCallback={onSigninCallback}>
      <HttpClientBridge>{children}</HttpClientBridge>
    </OidcProvider>
  );
}
