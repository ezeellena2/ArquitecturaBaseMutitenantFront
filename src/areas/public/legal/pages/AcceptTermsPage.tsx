import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey, useCurrentUser } from "@/auth/useCurrentUser";
import { beginSignOut, cancelSignOut } from "@/auth/signOutStatus";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { clearAccessError } from "@/shared/api/accessErrorStore";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { AcceptLegalRequest } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { acceptLegalDocuments } from "../api/acceptance";

export function AcceptTermsPage() {
  const { t } = useTranslation("legal");
  const { t: errors } = useTranslation("errors");
  const { data, isPending, refetch } = useCurrentUser();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const request = useIdempotentMutation((value: AcceptLegalRequest, key) => acceptLegalDocuments(value, key));
  const fallback = data?.access === "business" ? "/org" : data?.access === "platform" ? "/plataforma" : "/";
  const candidate: unknown = location.state?.returnTo;
  const returnTo = typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\") && !candidate.startsWith("/aceptar-terminos") ? candidate : fallback;
  const documents = data?.pendingLegalDocuments ?? [];
  const terms = documents.find((document) => document.kind === "Terms");
  const privacy = documents.find((document) => document.kind === "Privacy");
  async function accept() {
    setFailure(null);
    try {
      await request.mutateAsync({ documents: documents.map((document) => ({ id: document.id, version: document.version })) });
      clearAccessError();
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.detail ?? errors(error.isNetworkError ? "network" : "server") : errors("server"));
      if (error instanceof ApiError && error.code === "Legal.Document.VersionChanged") { setAccepted(false); await refetch(); }
    }
  }
  async function signOut() {
    beginSignOut(); queryClient.clear();
    try { const result: unknown = await auth.signoutRedirect(); if (result === null) cancelSignOut(); }
    catch { cancelSignOut(); setFailure(errors("server")); }
  }
  if (!isPending && data && documents.length === 0) { clearAccessError(); return <Navigate to={returnTo} replace />; }
  return <AuthLayout access={data?.access === "business" ? "business" : "consumer"} brandPanel="blank">
    <form className="flex flex-col gap-[22px]" onSubmit={(event) => { event.preventDefault(); if (accepted) void accept(); }}>
      <div><h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t("accept.title")}</h1>
        <p className="mt-2 text-[15px] leading-normal text-[var(--t2)]"><Trans ns="legal" i18nKey={terms && privacy ? "accept.bothChanged" : terms ? "accept.termsChanged" : "accept.privacyChanged"} values={{ termsVersion: terms?.version, privacyVersion: privacy?.version }} components={{ terms: <Link to="/terminos" target="_blank" rel="noopener" className="text-[var(--marca-tx)] hover:underline" />, privacy: <Link to="/privacidad" target="_blank" rel="noopener" className="text-[var(--marca-tx)] hover:underline" /> }} /></p>
      </div>
      <label className="flex items-start gap-2.5 text-[13px] leading-normal"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--marca)]" /><span><Trans ns="legal" i18nKey="accept.agreement" components={{ terms: <Link to="/terminos" target="_blank" rel="noopener" className="text-[var(--marca-tx)] hover:underline" />, privacy: <Link to="/privacidad" target="_blank" rel="noopener" className="text-[var(--marca-tx)] hover:underline" /> }} /></span></label>
      <FormError message={failure} />
      <div className="flex flex-col gap-2.5"><Button type="submit" size="lg" disabled={!accepted || request.isPending || isPending}>{t("accept.continue")}</Button><Button type="button" size="lg" variant="outline" onClick={() => { void signOut(); }}>{t("accept.signOut")}</Button></div>
    </form>
  </AuthLayout>;
}
