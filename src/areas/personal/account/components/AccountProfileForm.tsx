import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { api } from "@/shared/api/httpClient";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { MeResponse } from "@/shared/api/types";
import { changeCulture } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { Page } from "@/shared/ui/Page";
import { FormField } from "@/shared/ui/FormField";
import { FormError } from "@/shared/ui/FormError";
import { ConcurrencyBanner } from "@/shared/ui/ConcurrencyBanner";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { CultureSelect } from "@/shared/ui/fields/CultureSelect";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { updateMe } from "../api/account";

const schema = z.object({ displayName: z.string(), culture: z.string(), timeZoneId: z.string(), version: z.number() });
type Draft = z.infer<typeof schema>;
function draft(account: MeResponse): Draft {
  return { displayName: account.displayName ?? "", culture: account.culture, timeZoneId: account.timeZoneId, version: account.version ?? 0 };
}

export function AccountProfileForm({ account, children }: { account: MeResponse; children?: ReactNode }) {
  const { t } = useTranslation("account");
  const { t: errors } = useTranslation("errors");
  const queryClient = useQueryClient();
  const mobile = useMediaQuery("(max-width: 767px)");
  const [failure, setFailure] = useState<unknown>();
  const form = useForm<Draft>({ resolver: zodResolver(schema), defaultValues: draft(account) });
  const { isDirty, isSubmitting } = form.formState;
  const guard = useUnsavedChangesGuard(isDirty);

  async function reload() {
    try {
      const fresh = await api.get<MeResponse>("/api/me");
      queryClient.setQueryData(currentUserQueryKey, fresh);
      form.reset(draft(fresh));
      setFailure(undefined);
      await changeCulture(fresh.culture);
      return true;
    } catch (error) { setFailure(error); return false; }
  }
  async function save(values: Draft) {
    setFailure(undefined);
    try {
      await updateMe({ ...values, displayName: values.displayName.trim() || null });
      if (await reload()) toast.success(t("saved"));
    } catch (error) {
      if (!(error instanceof ApiError) || !applyApiErrorToForm(error, form.setError, { DisplayName: "displayName", displayName: "displayName", Culture: "culture", culture: "culture", TimeZoneId: "timeZoneId", timeZoneId: "timeZoneId" })) setFailure(error);
    }
  }
  function discard() { form.reset(); setFailure(undefined); }
  const actions = <>
    <Button type="button" variant="outline" onClick={discard} disabled={isSubmitting}>{t(mobile ? "discardMobile" : "discard")}</Button>
    <Button type="submit" form="account-profile" disabled={!isDirty || isSubmitting}>{t(mobile ? "saveMobile" : "save")}</Button>
  </>;
  const dirty = isDirty ? <span className="font-medium text-[var(--alerta)]">{t("unsaved")}</span> : null;
  return <>
    <Page title={t("title")} icon={UserRound} status={dirty} actions={!mobile ? actions : undefined}>
      <ConcurrencyBanner error={failure} isDirty={isDirty} onSeeNew={() => { void reload(); }} onContinueEditing={() => setFailure(undefined)} />
      {failure && (!(failure instanceof ApiError) || failure.code !== "General.ConcurrencyConflict") ? <FormError className="mb-3" message={failure instanceof Error ? failure.message : errors("server")} /> : null}
      <form id="account-profile" aria-label={t("title")} onSubmit={form.handleSubmit(save)}>
        <section role="region" aria-labelledby="account-data-title" className="overflow-hidden rounded-[12px] border border-[var(--borde)] bg-[var(--lado-activo)]">
          <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
            <h2 id="account-data-title">{t("data")}</h2>
          </header>
          {/* Tablero Cuenta: nombre, idioma y zona en tres columnas iguales, al ancho de la tarjeta. */}
          <div className="grid grid-cols-1 items-start gap-4 px-4 py-4 lg:grid-cols-3 lg:px-5 lg:py-4">
            <div className="min-w-0"><FormField label={t("name")} error={form.formState.errors.displayName?.message}><Input {...form.register("displayName")} autoComplete="name" /></FormField></div>
            <div className="min-w-0"><Controller control={form.control} name="culture" render={({ field }) => <FormField label={t("culture")} error={form.formState.errors.culture?.message}><CultureSelect value={field.value} onChange={field.onChange} variant="compact" placeholder={t("culture")} /></FormField>} /></div>
            <div className="min-w-0"><Controller control={form.control} name="timeZoneId" render={({ field }) => <FormField label={t("timeZone")} error={form.formState.errors.timeZoneId?.message}><TimeZoneSelect value={field.value} onChange={field.onChange} variant="compact" placeholder={t("timeZone")} /></FormField>} /></div>
          </div>
        </section>
      </form>
      {children}
    </Page>
    {mobile ? <div role="group" aria-label={t("pageActions")} data-account-actions className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--borde)] bg-[var(--lado-activo)] px-3 py-2.5 [&>button]:flex-1">{actions}</div> : null}
    <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.stay(); }} title={errors("unsaved.title")} description={errors("unsaved.description")} confirmLabel={errors("unsaved.leave")} cancelLabel={errors("unsaved.continueEditing")} destructive onConfirm={guard.leave} />
  </>;
}
