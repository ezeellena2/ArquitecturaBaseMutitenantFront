import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { currentUserQueryKey, fetchCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { MeResponse } from "@/shared/api/types";
import { changeCulture } from "@/shared/i18n";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
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
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<unknown>();
  const [reloadFailure, setReloadFailure] = useState<unknown>();
  const form = useForm<Draft>({ resolver: zodResolver(schema), defaultValues: draft(account) });
  const { isDirty, isSubmitting } = form.formState;

  // La relectura va por TanStack Query y, como /api/me, en silencio: si falla, lo dice la franja (también sin conexión,
  // con apiErrorMessage, porque es una consulta y el MutationCache no la avisó), una sola vez.
  async function reload() {
    try {
      const fresh = await queryClient.fetchQuery({ queryKey: currentUserQueryKey, queryFn: fetchCurrentUser, staleTime: 0, meta: { silent: true, blocksView: true } });
      form.reset(draft(fresh));
      setFailure(undefined);
      setReloadFailure(undefined);
      await changeCulture(fresh.culture);
      return true;
    } catch (error) { setReloadFailure(error); return false; }
  }
  // El 409 en su cartel, «Cambios sin guardar» en la banda, el error en la franja y «¿Salir sin guardar?».
  const edit = useEditPage({ isDirty, error: failure, onSeeNew: () => { void reload(); }, onContinueEditing: () => setFailure(undefined) });
  // Por TanStack Query, como toda escritura: los términos nuevos (403) abren la aceptación también desde acá, y la
  // relectura va en onSuccess para que «Reintentar» (sin conexión) termine igual que un guardado al primer intento.
  const update = useMutation({
    mutationFn: (values: Draft) => updateMe({ ...values, displayName: values.displayName.trim() || null }),
    onSuccess: async () => { if (await reload()) toast.success(t("saved")); },
  });
  async function save(values: Draft) {
    setFailure(undefined);
    setReloadFailure(undefined);
    try {
      await update.mutateAsync(values);
    } catch (error) {
      if (!(error instanceof ApiError) || !applyApiErrorToForm(error, form.setError, { DisplayName: "displayName", displayName: "displayName", Culture: "culture", culture: "culture", TimeZoneId: "timeZoneId", timeZoneId: "timeZoneId" })) setFailure(error);
    }
  }
  function discard() { form.reset(); setFailure(undefined); setReloadFailure(undefined); }
  const formError = edit.formError ?? (reloadFailure ? <FormError message={apiErrorMessage(reloadFailure, t)} /> : null);
  const actions = <>
    <Button type="button" variant="outline" onClick={discard} disabled={isSubmitting}>{t("discard")}</Button>
    <Button type="submit" form="account-profile" disabled={!isDirty || isSubmitting}>{t("save")}</Button>
  </>;
  return <>
    <Page title={t("title")} icon={UserRound} status={edit.unsaved} actions={actions} phoneBody="gray" banner={edit.banner}>
      {formError ? <div className="mb-3">{formError}</div> : null}
      <form id="account-profile" aria-label={t("title")} onSubmit={form.handleSubmit(save)}>
        <Section title={t("data")}>
          {/* Tablero Cuenta: nombre, idioma y zona en tres columnas iguales, al ancho de la tarjeta. */}
          <SectionFields className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 max-md:gap-3.5">
            <div className="min-w-0"><FormField label={t("name")} error={form.formState.errors.displayName?.message}><Input {...form.register("displayName")} autoComplete="name" /></FormField></div>
            <div className="min-w-0"><Controller control={form.control} name="culture" render={({ field }) => <FormField label={t("culture")} error={form.formState.errors.culture?.message}><CultureSelect value={field.value} onChange={field.onChange} placeholder={t("culture")} /></FormField>} /></div>
            <div className="min-w-0"><Controller control={form.control} name="timeZoneId" render={({ field }) => <FormField label={t("timeZone")} error={form.formState.errors.timeZoneId?.message}><TimeZoneSelect value={field.value} onChange={field.onChange} placeholder={t("timeZone")} /></FormField>} /></div>
          </SectionFields>
        </Section>
      </form>
      {children}
    </Page>
    {edit.leaveDialog}
  </>;
}
