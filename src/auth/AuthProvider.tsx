import { useLayoutEffect, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth, type AuthContextProps } from "react-oidc-context";
import { configureHttpClient } from "@/shared/api/httpClient";
import i18n from "@/shared/i18n";
import { authConfig } from "./authConfig";

let session: AuthContextProps | undefined;

// El puente está listo antes de la primera consulta que hagan los hijos.
configureHttpClient({
  getAccessToken: () => session?.user?.access_token,
  getCulture: () => i18n.language,
});

function onSigninCallback(): void {
  globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
}

function HttpClientBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useLayoutEffect(() => {
    session = auth;
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
