import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { configureI18n, cultureStorageKey, effectiveCulture } from "@/shared/i18n";
import { queryClient } from "@/shared/api/queryClient";
import { FormatProvider } from "@/shared/format/useFormat";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Toaster } from "@/shared/ui/sonner";
import { Button } from "@/shared/ui/button";
import { safeStorageGet } from "@/shared/hooks/safeStorage";
import { AppAuthProvider } from "@/auth/AuthProvider";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { useCurrentUser } from "@/auth/useCurrentUser";

function ReferenceDataStartup({ children }: { children: ReactNode }) {
  const { data, isError, refetch } = useReferenceData();
  const { data: user } = useCurrentUser();
  const { t } = useTranslation();

  useEffect(() => {
    if (!data) return;
    const stored = safeStorageGet(cultureStorageKey);
    const chosen = data.cultures.find((culture) => culture.isEnabled && culture.code === user?.culture)?.code
      ?? data.cultures.find((culture) => culture.isEnabled && culture.code === stored)?.code
      ?? data.cultures.find((culture) => culture.isEnabled && culture.code === effectiveCulture())?.code
      ?? data.cultures.find((culture) => culture.isEnabled && culture.isDefault)?.code;
    // Repetir init en cada montaje suspende los controles mientras cargan namespaces.
    if (i18n.isInitialized && i18n.language === chosen) return;
    void configureI18n(data.cultures, chosen);
  }, [data, user?.culture]);

  if (isError) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <p role="alert">{t("states.error")}</p>
    <Button onClick={() => void refetch()}>{t("actions.retry")}</Button>
  </main>;

  return children;
}

export function AppProviders({ children, client = queryClient, authContext }: { children: ReactNode; client?: QueryClient; authContext?: AuthContextProps }) {
  const content = <QueryClientProvider client={client}>
    <ReferenceDataStartup>
      <FormatProvider>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </FormatProvider>
    </ReferenceDataStartup>
    <Toaster />
  </QueryClientProvider>;

  return (
    <I18nextProvider i18n={i18n}>
      <AppAuthProvider>
        {authContext ? <AuthContext.Provider value={authContext}>{content}</AuthContext.Provider> : content}
      </AppAuthProvider>
    </I18nextProvider>
  );
}
