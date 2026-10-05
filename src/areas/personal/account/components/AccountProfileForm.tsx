import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { currentUserQueryKey, fetchCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { MeResponse } from "@/shared/api/types";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { changeCulture } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { CultureSelect } from "@/shared/ui/fields/CultureSelect";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import { updateMe } from "../api/account";

/// «Tus datos» no tiene datos obligatorios: el nombre vacío se guarda como «sin nombre». La versión la lleva `useEditForm`:
/// es la de lo que se cargó y se conserva hasta guardar, «Ver lo nuevo» o descartar; después de un 409, el próximo
/// guardado vuelve a dar 409. Es la versión propia del perfil (`/api/me.version`, 0 si nunca se guardó, y el 0 es una
/// versión): cambiar un método de ingreso no la mueve.
const profileFormSchema = z.object({ displayName: z.string(), culture: z.string(), timeZoneId: z.string() });
type ProfileForm = z.infer<typeof profileFormSchema>;

// Los errores de validación del back, en PascalCase o en camelCase, a su campo.
const serverFields: Record<string, keyof ProfileForm> = {
  DisplayName: "displayName", displayName: "displayName", Culture: "culture", culture: "culture", TimeZoneId: "timeZoneId", timeZoneId: "timeZoneId",
};

function valuesFromAccount(account: MeResponse): ProfileForm {
  return { displayName: account.displayName ?? "", culture: account.culture, timeZoneId: account.timeZoneId };
}

/// «Tus datos» de Mi cuenta (tableros Cuenta y M-Cuenta), como el editor de Roles: React Hook Form con zod, la versión de
/// `useEditForm`, y el 409, «Cambios sin guardar», la franja y «¿Salir sin guardar?» de `useEditPage`.
export function AccountProfileForm({ account, children }: { account: MeResponse; children?: ReactNode }) {
  const { t } = useTranslation("account");
  const queryClient = useQueryClient();
  const { form, version, resetTo, wrote } = useEditForm({ read: account, toValues: valuesFromAccount, resolver: zodResolver(profileFormSchema) });
  const { errors, isDirty } = form.formState;
  const culture = useController({ control: form.control, name: "culture" });
  const timeZone = useController({ control: form.control, name: "timeZoneId" });
  const [failure, setFailure] = useState<unknown>();
  const [reloadFailure, setReloadFailure] = useState<unknown>();

  // La relectura va por TanStack Query y, como /api/me, en silencio: si falla, lo dice la franja (también sin conexión,
  // con apiErrorMessage, porque es una consulta y el MutationCache no la avisó), una sola vez. `adopt` le pasa la lectura
  // al formulario: «Ver lo nuevo» reinicia con ella y, después de guardar, es la nueva base.
  async function reload(adopt: (fresh: MeResponse) => void) {
    try {
      const fresh = await queryClient.fetchQuery({ queryKey: currentUserQueryKey, queryFn: fetchCurrentUser, staleTime: 0, meta: { silent: true, blocksView: true } });
      adopt(fresh);
      setFailure(undefined);
      setReloadFailure(undefined);
      await changeCulture(fresh.culture);
      return true;
    } catch (error) { setReloadFailure(error); return false; }
  }
  // El 409 en su cartel, «Cambios sin guardar» en la banda, el error en la franja y «¿Salir sin guardar?».
  const edit = useEditPage({ isDirty, error: failure, onSeeNew: () => { void reload(resetTo); }, onContinueEditing: () => setFailure(undefined) });
  // Por TanStack Query, como toda escritura: los términos nuevos (403) abren la aceptación también desde acá, y la
  // relectura va en onSuccess para que «Reintentar» (sin conexión) termine igual que un guardado al primer intento. La
  // ficha queda limpia con lo guardado y, con la relectura, esa es la nueva base.
  const update = useMutation({
    mutationFn: (request: ProfileForm & { version: number | undefined }) => updateMe({ ...request, displayName: request.displayName.trim() || null }),
    onSuccess: async (_result, { version: sentVersion, ...values }) => {
      form.reset(values);
      if (await reload((fresh) => { if (sentVersion !== undefined) wrote(sentVersion, fresh); })) toast.success(t("saved"));
    },
  });

  function rejected(error: unknown) {
    if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return;
    setFailure(error);
  }

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    setReloadFailure(undefined);
    update.mutate({ ...values, version }, { onError: rejected });
  });

  // «Descartar cambios» vuelve a la última lectura de lo guardado, con su versión.
  function discard() {
    resetTo(account);
    setFailure(undefined);
    setReloadFailure(undefined);
  }

  const formError = edit.formError ?? (reloadFailure ? <FormError message={apiErrorMessage(reloadFailure, t)} /> : null);
  const actions = <>
    <Button type="button" variant="outline" onClick={discard}>{t("discard")}</Button>
    <Button type="submit" form="account-profile" disabled={!isDirty} pending={update.isPending}>{t("save")}</Button>
  </>;
  return <>
    <Page title={t("title")} icon={UserRound} status={edit.unsaved} actions={actions} phoneBody="gray" banner={edit.banner}>
      {formError ? <div className="mb-3">{formError}</div> : null}
      <form id="account-profile" noValidate aria-label={t("title")} onSubmit={(event) => { void submit(event); }}>
        <Section title={t("data")}>
          {/* Tablero Cuenta: nombre, idioma y zona en tres columnas iguales, al ancho de la tarjeta. */}
          <SectionFields className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 max-md:gap-3.5">
            <div className="min-w-0"><FormField label={t("name")} error={errors.displayName?.message}><Input {...form.register("displayName")} autoComplete="name" /></FormField></div>
            <div className="min-w-0"><FormField label={t("culture")} error={errors.culture?.message}><CultureSelect value={culture.field.value} onChange={culture.field.onChange} placeholder={t("culture")} /></FormField></div>
            <div className="min-w-0"><FormField label={t("timeZone")} error={errors.timeZoneId?.message}><TimeZoneSelect value={timeZone.field.value} onChange={timeZone.field.onChange} placeholder={t("timeZone")} /></FormField></div>
          </SectionFields>
        </Section>
      </form>
      {children}
    </Page>
    {edit.leaveDialog}
  </>;
}
