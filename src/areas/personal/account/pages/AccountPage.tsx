import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AccountProfileForm } from "../components/AccountProfileForm";
import { useQuery } from "@tanstack/react-query";
import { accountMethodsQueryKey, fetchLoginMethods } from "../api/loginMethods";
import { LoginMethodsTable } from "../components/LoginMethodsTable";
import { PersonalLoginMethodNotice } from "@/shared/ui/PersonalLoginMethodNotice";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { AccountLoginMethod } from "@/shared/api/types";
import { AddLoginMethodDialog } from "../components/AddLoginMethodDialog";
import { VerifyLoginMethodDialog } from "../components/VerifyLoginMethodDialog";

export function AccountPage() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCurrentUser();
  const methods = useQuery({ queryKey: accountMethodsQueryKey, queryFn: fetchLoginMethods });
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<AccountLoginMethod | null>(null);
  function refresh() { void queryClient.invalidateQueries({ queryKey: accountMethodsQueryKey }); void queryClient.invalidateQueries({ queryKey: currentUserQueryKey }); }
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  if (!data) return <div className="p-6"><FormError message={error instanceof Error ? error.message : t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  return <><AccountProfileForm key={data.id} account={data}>
    <div className="col-span-full my-1 h-px bg-[var(--borde)]" />
    <h2 className="col-span-full mt-1 text-[15px] font-semibold">{t("account:methods")}</h2>
    {methods.data?.needsPersonalLoginMethod ? <div className="col-span-full"><PersonalLoginMethodNotice onAdd={() => setAddOpen(true)} /></div> : null}
    {methods.isPending ? <p className="col-span-full" role="status">{t("states.loading")}</p> : null}
    {methods.error ? <div className="col-span-full"><FormError message={methods.error.message} /><Button type="button" onClick={() => { void methods.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {methods.data ? <LoginMethodsTable methods={methods.data.methods} onAction={(action, method) => { if (action === "verify") setVerifyMethod(method); }} /> : null}
    <div className="col-span-full flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setAddOpen(true)}><Plus size={16} />{t("account:add")}</Button></div>
  </AccountProfileForm>
  {addOpen ? <AddLoginMethodDialog open onOpenChange={setAddOpen} onComplete={refresh} /> : null}
  {verifyMethod ? <VerifyLoginMethodDialog method={verifyMethod} open onOpenChange={(open) => { if (!open) setVerifyMethod(null); }} onComplete={refresh} /> : null}
  </>;
}
