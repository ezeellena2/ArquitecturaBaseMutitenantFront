import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AccountProfileForm } from "../components/AccountProfileForm";
import { useQuery } from "@tanstack/react-query";
import { accountMethodsQueryKey, fetchLoginMethods } from "../api/loginMethods";
import { LoginMethodsTable } from "../components/LoginMethodsTable";
import { PersonalLoginMethodNotice } from "@/shared/ui/PersonalLoginMethodNotice";

export function AccountPage() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCurrentUser();
  const methods = useQuery({ queryKey: accountMethodsQueryKey, queryFn: fetchLoginMethods });
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  if (!data) return <div className="p-6"><FormError message={error instanceof Error ? error.message : t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  return <AccountProfileForm key={data.id} account={data}>
    <div className="col-span-full my-1 h-px bg-[var(--borde)]" />
    <h2 className="col-span-full mt-1 text-[15px] font-semibold">{t("account:methods")}</h2>
    {methods.data?.needsPersonalLoginMethod ? <div className="col-span-full"><PersonalLoginMethodNotice /></div> : null}
    {methods.isPending ? <p className="col-span-full" role="status">{t("states.loading")}</p> : null}
    {methods.error ? <div className="col-span-full"><FormError message={methods.error.message} /><Button type="button" onClick={() => { void methods.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {methods.data ? <LoginMethodsTable methods={methods.data.methods} onAction={() => {}} /> : null}
  </AccountProfileForm>;
}
