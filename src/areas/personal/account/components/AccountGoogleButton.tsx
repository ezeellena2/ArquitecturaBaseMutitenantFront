import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { linkGoogle } from "@/shared/account/api/loginMethods";

export function AccountGoogleButton({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("account");
  const challenge = useMutation({ mutationFn: linkGoogle, onSuccess: (result) => window.location.assign(result.redirectUrl) });
  return <Button type="button" aria-label={compact ? t("linkGoogle") : undefined} variant="outline" size={compact ? "sm" : "default"}
    onClick={() => challenge.mutate()} pending={challenge.isPending}>{t(compact ? "linkGoogleShort" : "linkGoogle")}</Button>;
}
