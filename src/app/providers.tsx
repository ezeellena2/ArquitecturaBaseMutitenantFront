import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n";
import { queryClient } from "@/shared/api/queryClient";
import { Toaster } from "@/shared/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
        <Suspense fallback={null}><Toaster /></Suspense>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
