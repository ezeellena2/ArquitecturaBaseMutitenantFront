import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import googleMark from "@/assets/google-mark.svg";
import { getLoginMethods, loginMethodsQueryKey } from "../api/methods";

export type GoogleButtonProps =
  | { mode: "login"; access: "consumer" | "business"; returnUrl: string; acceptedTerms?: never; returnTo?: never }
  | { mode: "signup"; acceptedTerms: boolean; returnTo: string; access?: never; returnUrl?: never };

function GoogleMark() {
  return <img src={googleMark} width="18" height="18" alt="" aria-hidden="true" />;
}

function googleUrl(props: GoogleButtonProps): string {
  const query = props.mode === "login"
    ? new URLSearchParams({ returnUrl: props.returnUrl, access: props.access })
    : new URLSearchParams({ signup: "true", acceptedTerms: "true", returnTo: props.returnTo });
  return `/api/auth/external/google?${query}`;
}

export function GoogleButton(props: GoogleButtonProps) {
  const { t } = useTranslation("auth");
  const { data } = useQuery({ queryKey: loginMethodsQueryKey, queryFn: getLoginMethods, meta: { silent: true } });
  if (!data?.channels.some((channel) => channel.key === "google")) return null;

  const label = props.mode === "signup" ? t("signup.google") : t("login.google");
  const className = "w-full border-[var(--t3)] text-[var(--t1)]";
  if (props.mode === "signup" && !props.acceptedTerms) {
    return <Button type="button" variant="outline" size="lg" className={className} disabled><GoogleMark />{label}</Button>;
  }
  return <Button asChild variant="outline" size="lg" className={className}>
    <a href={googleUrl(props)}><GoogleMark />{label}</a>
  </Button>;
}
