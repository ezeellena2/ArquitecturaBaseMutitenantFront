import { useId } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import googleMark from "@/assets/google-mark.svg";
import { effectiveCulture } from "@/shared/i18n";
import { browserTimeZone } from "@/shared/time/browserTimeZone";
import { getLoginMethods, loginMethodsQueryKey } from "../api/methods";
import { getGoogleSignupAntiforgery, googleSignupAntiforgeryQueryKey } from "../api/googleSignup";

export type GoogleButtonProps =
  | { mode: "login"; access: "consumer" | "business"; returnUrl: string; acceptedTerms?: never; returnTo?: never }
  | { mode: "signup"; acceptedTerms: boolean; returnTo: string; access?: never; returnUrl?: never };

function GoogleMark() {
  return <img src={googleMark} width="18" height="18" alt="" aria-hidden="true" />;
}

function loginGoogleUrl(props: Extract<GoogleButtonProps, { mode: "login" }>): string {
  const query = new URLSearchParams({ returnUrl: props.returnUrl, access: props.access });
  return `/api/auth/external/google?${query}`;
}

export function GoogleButton(props: GoogleButtonProps) {
  const { t } = useTranslation("auth");
  const { data } = useQuery({ queryKey: loginMethodsQueryKey, queryFn: getLoginMethods, meta: { silent: true } });
  const available = data?.channels.some((channel) => channel.key === "google") === true;
  const formId = useId();
  const { data: csrf } = useQuery({
    queryKey: googleSignupAntiforgeryQueryKey,
    queryFn: getGoogleSignupAntiforgery,
    enabled: available && props.mode === "signup",
    meta: { silent: true },
  });
  if (!available) return null;

  const label = props.mode === "signup" ? t("signup.google") : t("login.google");
  const className = "w-full border-[var(--t3)] text-[var(--t1)]";
  if (props.mode === "signup") {
    const culture = effectiveCulture() ?? navigator.language;
    const timeZoneId = browserTimeZone();
    return <>
      {/* Registro ya contiene el formulario de correo; el formulario OAuth vive fuera de él. */}
      {createPortal(<form id={formId} action="/api/auth/external/google" method="post" hidden>
        <input type="hidden" name="__RequestVerificationToken" value={csrf?.requestToken ?? ""} />
        <input type="hidden" name="signup" value="true" />
        <input type="hidden" name="acceptedTerms" value="true" />
        <input type="hidden" name="returnTo" value={props.returnTo} />
        <input type="hidden" name="culture" value={culture} />
        {timeZoneId ? <input type="hidden" name="timeZoneId" value={timeZoneId} /> : null}
      </form>, document.body)}
      <Button type="submit" form={formId} variant="outlineSurface" size="lg" className={className}
        disabled={!props.acceptedTerms || !csrf?.requestToken}><GoogleMark />{label}</Button>
    </>;
  }
  return <Button asChild variant="outlineSurface" size="lg" className={className}>
    <a href={loginGoogleUrl(props)}><GoogleMark />{label}</a>
  </Button>;
}
