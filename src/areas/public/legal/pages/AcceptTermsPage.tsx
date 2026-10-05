import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { currentUserQueryKey, useCurrentUser } from "@/auth/useCurrentUser";
import { useSignOut } from "@/auth/useSignOut";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { clearAccessError } from "@/shared/api/accessErrorStore";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { AcceptLegalRequest } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { acceptLegalDocuments } from "../api/acceptance";
import { homeOf } from "@/tenancy/access";

/// Lo que se valida antes de mandar: la casilla de aceptación, con el texto del tablero Aceptar-Terminos.
function acceptFormSchema(t: TFunction) {
  return z.object({ accepted: z.boolean().refine(Boolean, t("legal:accept.acceptRequired")) });
}

type AcceptForm = z.infer<ReturnType<typeof acceptFormSchema>>;

/// «Actualizamos los términos» (tablero Aceptar-Terminos), con React Hook Form y zod como el editor de Roles: «Aceptar y
/// seguir» no se apaga; sin la casilla, la aceptación se pide debajo de ella y se va al marcarla.
export function AcceptTermsPage() {
  const { t } = useTranslation(["legal", "errors"]);
  const { data, isPending, refetch } = useCurrentUser();
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const schema = useMemo(() => acceptFormSchema(t), [t]);
  // La casilla no se vuelve a revisar al tocarla: el aviso se va con el cambio (`clearErrors`) y vuelve solo al enviar.
  const form = useForm<AcceptForm>({ resolver: zodResolver(schema), defaultValues: { accepted: false }, reValidateMode: "onSubmit" });
  const [failure, setFailure] = useState<string | null>(null);
  const request = useIdempotentMutation((value: AcceptLegalRequest, key) => acceptLegalDocuments(value, key), { meta: { handlesError: true } });
  const fallback = homeOf(data?.access ?? "consumer");
  const candidate: unknown = location.state?.returnTo;
  const returnTo = typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\") && !candidate.startsWith("/aceptar-terminos") ? candidate : fallback;
  const documents = data?.pendingLegalDocuments ?? [];
  const terms = documents.find((document) => document.kind === "Terms");
  const privacy = documents.find((document) => document.kind === "Privacy");
  const acceptError = form.formState.errors.accepted?.message;

  const submit = form.handleSubmit(() => {
    setFailure(null);
    request.mutate({ documents: documents.map((document) => ({ id: document.id, version: document.version })) }, {
      onSuccess: async () => {
        clearAccessError();
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
        void navigate(returnTo, { replace: true });
      },
      onError: (error) => {
        setFailure(apiErrorMessage(error, t));
        if (error instanceof ApiError && error.code === "Legal.Document.VersionChanged") { form.reset({ accepted: false }); void refetch(); }
      },
    });
  });

  async function leave() {
    if (!(await signOut())) setFailure(t("errors:server"));
  }
  if (!isPending && data && documents.length === 0) { clearAccessError(); return <Navigate to={returnTo} replace />; }
  return <AuthLayout access={data?.access === "business" ? "business" : "consumer"} brandPanel="blank">
    <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => { void submit(event); }}>
      <div><h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("legal:accept.title")}</h1>
        <p className="mt-2 text-sm leading-normal text-[var(--t2)]"><Trans ns="legal" i18nKey={terms && privacy ? "accept.bothChanged" : terms ? "accept.termsChanged" : "accept.privacyChanged"} values={{ termsVersion: terms?.version, privacyVersion: privacy?.version }} components={{ terms: <Link to="/terminos" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" />, privacy: <Link to="/privacidad" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" /> }} /></p>
      </div>
      <label className="flex items-start gap-2.5 text-[14px] leading-normal"><input type="checkbox" {...form.register("accepted", { onChange: () => form.clearErrors("accepted") })} className="mt-0.5 size-[18px] shrink-0 accent-[var(--marca)]" /><span><Trans ns="legal" i18nKey="accept.agreement" components={{ terms: <Link to="/terminos" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" />, privacy: <Link to="/privacidad" target="_blank" rel="noopener" className="font-semibold text-[var(--marca-tx)] hover:underline" /> }} /></span></label>
      {acceptError ? <p role="alert" className="-mt-4 text-[13px] text-[var(--peligro)]">{acceptError}</p> : null}
      <FormError message={failure} />
      <div className="flex flex-col gap-2.5"><Button type="submit" size="lg" disabled={isPending} pending={request.isPending} pendingLabel={t("legal:accept.accepting")}>{t("legal:accept.continue")}</Button><Button type="button" size="lg" variant="outline" onClick={() => { void leave(); }}>{t("legal:accept.signOut")}</Button></div>
    </form>
  </AuthLayout>;
}
