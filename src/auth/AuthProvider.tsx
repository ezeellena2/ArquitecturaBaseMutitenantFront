import { useLayoutEffect, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth, type AuthContextProps } from "react-oidc-context";
import { configureHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import i18n from "@/shared/i18n";
import { authConfig } from "./authConfig";
import { rememberExpiredSessionNotice } from "./sessionExpiredNotice";

let session: AuthContextProps | undefined;

// El puente está listo antes de la primera consulta que hagan los hijos.
const httpClientOptions = {
  getAccessToken: () => session?.user?.access_token,
  getCulture: () => i18n.language,
  renewAccessToken: async () => (await session?.signinSilent())?.access_token,
  onSessionExpired: async () => {
    const access = session?.user?.profile.access;
    const returnUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
    const loginPath = access === "business" || returnUrl.startsWith("/org") ? "/login/empresa" : "/login";
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
