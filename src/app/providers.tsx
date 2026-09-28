import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { configureI18n, cultureStorageKey } from "@/shared/i18n";
import { queryClient } from "@/shared/api/queryClient";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { Toaster } from "@/shared/ui/sonner";

function ReferenceDataStartup() {
  const { data } = useReferenceData();

  useEffect(() => {
    if (!data) return;
    const stored = globalThis.localStorage?.getItem(cultureStorageKey);
    const chosen = data.cultures.find((culture) => culture.isEnabled && culture.code === stored)?.code
      ?? data.cultures.find((culture) => culture.isEnabled && culture.isDefault)?.code;
    // Repetir init en cada montaje suspende los controles mientras cargan namespaces.
    if (i18n.isInitialized && i18n.language === chosen) return;
    void configureI18n(data.cultures);
  }, [data]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ReferenceDataStartup />
        <Suspense fallback={null}>{children}</Suspense>
        <Suspense fallback={null}><Toaster /></Suspense>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
