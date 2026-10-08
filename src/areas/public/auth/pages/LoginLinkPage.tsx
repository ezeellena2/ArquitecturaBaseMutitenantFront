import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useLoginChannels } from "@/shared/account/useLoginChannels";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/Avatar";
import { ClockIcon, LockIcon } from "@/shared/ui/icons";
import { homeOf } from "@/tenancy/access";
import { previewLoginLink, redeemLoginLink } from "../api/loginLink";
import { AuthMessage } from "../components/AuthMessage";
import { AuthStatus } from "../components/AuthStatus";
import { loginLinkErrorState, loginLinkToken, publicWhatsAppUrl, stripLoginLinkFragment } from "../lib/loginLinkState";

export function LoginLinkPage() {
  const { t } = useTranslation(["auth", "errors"]);
  const auth = useAuth();
  const client = useQueryClient();
  // Solo memoria de esta pantalla. Ninguna variable de Query contiene el secreto.
  const [token] = useState(() => loginLinkToken(globalThis.location.hash));
  const [failure, setFailure] = useState<unknown>(null);
  const [starting, setStarting] = useState(false);
  const started = useRef(false);
  const alive = useRef(true);
  const redeemed = useRef(false);
  const access = useRef<"consumer">("consumer");
  const retry = useRetryAfterCountdown();
  const channels = useLoginChannels();
  const preview = useMutation({ mutationFn: () => previewLoginLink({ token: token! }), meta: { handlesError: true } });
  const redeem = useIdempotentMutation((_input: void, key) => redeemLoginLink({ token: token!, access: "consumer" }, key), { meta: { handlesError: true } });
  useLayoutEffect(stripLoginLinkFragment, []);
  const runPreview = async () => {
    setFailure(null);
    try { await preview.mutateAsync(); }
    catch (error) { if (alive.current) { setFailure(error); retry.startFromError(error); } }
  };
  const previewOnMount = useEffectEvent(runPreview);
  useEffect(() => {
    alive.current = true;
    let mounted = true;
    queueMicrotask(() => { if (mounted && token) void previewOnMount(); });
    return () => { mounted = false; alive.current = false; };
    // El secreto y la vista previa pertenecen exclusivamente a este montaje.
  }, [token]);

  async function continueLogin() {
    if (started.current || retry.isRunning || !token) return;
    started.current = true; setStarting(true); setFailure(null);
    try {
      if (!redeemed.current) {
        const result = await redeem.mutateAsync();
        if (!alive.current) return;
        access.current = result.access; redeemed.current = true;
      }
      await auth.removeUser();
      if (!alive.current) return;
      client.clear();
      await auth.signinRedirect({ extraQueryParams: { access: access.current }, state: { returnTo: homeOf(access.current) } });
    } catch (error) {
      if (alive.current) { setFailure(error); retry.startFromError(error); setStarting(false); started.current = false; }
    }
  }

  const errorState = failure ? loginLinkErrorState(failure) : null;
  const whatsapp = publicWhatsAppUrl(channels.data?.channels.find((channel) => channel.key === "whatsapp")?.contactPhone);
  const loginAction = <Button asChild size="lg" variant="outline"><Link to="/login">{t("loginLink.login")}</Link></Button>;
  return <AuthLayout access="consumer">
    {!token || errorState === "invalid" ? <AuthStatus icon={ClockIcon} tone="neutral" title={t("loginLink.invalidTitle")} detail={t("loginLink.invalidDetail")}
      actions={<div className="flex flex-col gap-2.5">{whatsapp ? <Button asChild size="lg"><a href={whatsapp}>{t("loginLink.whatsapp")}</a></Button> : null}{loginAction}</div>} />
      : errorState === "suspended" ? <AuthStatus icon={LockIcon} tone="danger" title={t("loginLink.suspendedTitle")} detail={apiErrorMessage(failure, t)} actions={loginAction} />
      : starting ? <div role="status" className="flex flex-col items-center gap-[18px]"><span aria-hidden="true" className="size-8 animate-spin motion-reduce:animate-none rounded-full border-2 border-[var(--borde)] border-t-[var(--marca)]" /><div className="text-center"><h1 className="text-[24px] font-bold">{t("loginLink.startingTitle")}</h1><p className="mt-1.5 text-sm text-[var(--t2)]">{t("loginLink.startingDetail")}</p></div></div>
      : <div className="flex flex-col gap-[22px]">
        <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("loginLink.title")}</h1>
        {preview.data ? <div><p className="mb-1.5 text-[13px] font-medium">{t("loginLink.as")}</p><div className="flex items-center gap-3 rounded-[10px] border border-[var(--borde)] bg-[var(--s2)] p-3"><Avatar size="large" initials={preview.data.displayName?.slice(0, 1) ?? ""} /><div><p className="text-[15px] font-semibold">{preview.data.displayName}</p><p className="text-[13px] text-[var(--t2)]">{preview.data.maskedPhone}</p></div></div></div> : preview.isPending ? <p role="status">{t("common:states.loading")}</p> : null}
        <AuthMessage message={failure ? { text: failure instanceof ApiError && failure.status === 429 ? t("loginLink.tooManyRequests") : apiErrorMessage(failure, t) } : null} />
        <Button size="lg" disabled={retry.isRunning || preview.isPending} onClick={() => { if (preview.data) void continueLogin(); else void runPreview(); }}>{retry.label ?? t(preview.data ? "loginLink.continue" : "common:actions.retry")}</Button>
        <p className="text-center text-[12px] leading-normal text-[var(--t3)]">{t("loginLink.notice")}</p>
      </div>}
  </AuthLayout>;
}
