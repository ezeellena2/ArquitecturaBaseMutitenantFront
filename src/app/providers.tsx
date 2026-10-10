import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { chosenCulture, configureI18n, effectiveCulture, resolveCulture } from "@/shared/i18n";
import { queryClient } from "@/shared/api/queryClient";
import { FormatProvider } from "@/shared/format/useFormat";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Toaster } from "@/shared/ui/sonner";
import { IconDefaults } from "@/shared/ui/IconDefaults";
import { Button } from "@/shared/ui/button";
import { AppAuthProvider } from "@/auth/AuthProvider";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ModuleRegistryProvider } from "@/shared/modules/ModuleRegistry";
import type { ModuleRegistration } from "@/shared/modules/types";
import { moduleComposition } from "./moduleComposition";

function ReferenceDataStartup({ children }: { children: ReactNode }) {
  const { data, isError, refetch } = useReferenceData();
  const { data: user } = useCurrentUser();
  const { t } = useTranslation();

  // La única decisión de la cultura efectiva: i18n la aplica y de ella leen los formatos, el catálogo y Accept-Language.
  useEffect(() => {
    if (!data) return;
    const culture = resolveCulture({ account: user?.culture, chosen: chosenCulture(), cultures: data.cultures });
    // Repetir init en cada montaje suspende los controles mientras cargan namespaces.
    if (i18n.isInitialized && effectiveCulture() === culture) return;
    void configureI18n(data.cultures, culture);
  }, [data, user?.culture]);

  if (isError && data === undefined) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <p role="alert">{t("states.error")}</p>
    <Button onClick={() => void refetch()}>{t("actions.retry")}</Button>
  </main>;

  return children;
}

export function AppProviders({ children, client = queryClient, authContext, modules = moduleComposition }: { children: ReactNode; client?: QueryClient; authContext?: AuthContextProps; modules?: readonly ModuleRegistration[] }) {
  const content = <QueryClientProvider client={client}>
    <ReferenceDataStartup>
      <FormatProvider>
        <Suspense fallback={null}>
          <ModuleRegistryProvider value={modules}>{children}</ModuleRegistryProvider>
        </Suspense>
      </FormatProvider>
    </ReferenceDataStartup>
    <Toaster />
  </QueryClientProvider>;

  return (
    <I18nextProvider i18n={i18n}>
      <IconDefaults>
        <AppAuthProvider>
          {authContext ? <AuthContext.Provider value={authContext}>{content}</AuthContext.Provider> : content}
        </AppAuthProvider>
      </IconDefaults>
    </I18nextProvider>
  );
}
