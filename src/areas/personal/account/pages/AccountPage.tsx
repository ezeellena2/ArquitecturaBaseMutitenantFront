import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AccountProfileForm } from "../components/AccountProfileForm";
import { useQuery } from "@tanstack/react-query";
import { accountMethodsQueryKey, fetchLoginMethods } from "../api/loginMethods";
import { LoginMethodsTable } from "../components/LoginMethodsTable";
import { PersonalLoginMethodNotice } from "@/shared/ui/PersonalLoginMethodNotice";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { AccountLoginMethod } from "@/shared/api/types";
import { AddLoginMethodDialog } from "../components/AddLoginMethodDialog";
import { VerifyLoginMethodDialog } from "../components/VerifyLoginMethodDialog";
import { ChangeLoginMethodDialog } from "../components/ChangeLoginMethodDialog";
import { AccountGoogleButton } from "../components/AccountGoogleButton";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "react-oidc-context";
import { showDeletionRequested } from "@/auth/deletionRequestStatus";
import { useFormat } from "@/shared/format/useFormat";
import { AccountDeletionDialog } from "../components/AccountDeletionDialog";

export function AccountPage() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCurrentUser();
  const methods = useQuery({ queryKey: accountMethodsQueryKey, queryFn: fetchLoginMethods });
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<AccountLoginMethod | null>(null);
  const [change, setChange] = useState<{ action: "remove" | "primary"; method: AccountLoginMethod } | null>(null);
  const mobile = useMediaQuery("(max-width: 767px)");
  const [params, setParams] = useSearchParams();
  const handledGoogle = useRef(false);
  const auth = useAuth();
  const format = useFormat();
  const [deletionOpen, setDeletionOpen] = useState(false);
  function refresh() { void queryClient.invalidateQueries({ queryKey: accountMethodsQueryKey }); void queryClient.invalidateQueries({ queryKey: currentUserQueryKey }); }
  async function deleted(scheduledForUtc: string) {
    showDeletionRequested(format.formatDate(scheduledForUtc));
    await auth.removeUser();
    queryClient.clear();
  }
  useEffect(() => {
    if (handledGoogle.current || (!params.has("google") && !params.has("error"))) return;
    handledGoogle.current = true;
    if (params.get("google") === "linked") { toast.success(t("account:googleLinked")); refresh(); }
    else if (params.has("error")) {
      const key = params.get("error") === "Identity.Google.AlreadyUsed" ? "googleAlreadyUsed" : params.get("error") === "Auth.ExternalLogin.EmailNotVerified" ? "googleEmailNotVerified" : "googleFailed";
      toast.error(t(`account:${key}`));
    }
    const clean = new URLSearchParams(params); clean.delete("google"); clean.delete("error"); setParams(clean, { replace: true });
  });
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  if (!data) return <div className="p-6"><FormError message={error instanceof Error ? error.message : t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  return <><AccountProfileForm key={data.id} account={data}>
    <div className="col-span-full my-1 h-px bg-[var(--borde)]" />
    <div className="col-span-full mt-1 flex items-center justify-between gap-3"><h2 className="text-[15px] font-semibold">{t("account:methods")}</h2>{!mobile ? <div className="flex gap-2">{methods.data?.canLinkGoogle ? <AccountGoogleButton /> : null}<Button type="button" variant="outline" onClick={() => setAddOpen(true)}><Plus size={16} />{t("account:add")}</Button></div> : null}</div>
    {methods.data?.needsPersonalLoginMethod ? <div className="col-span-full"><PersonalLoginMethodNotice onAdd={() => setAddOpen(true)} /></div> : null}
    {methods.isPending ? <p className="col-span-full" role="status">{t("states.loading")}</p> : null}
    {methods.error ? <div className="col-span-full"><FormError message={methods.error.message} /><Button type="button" onClick={() => { void methods.refetch(); }}>{t("actions.retry")}</Button></div> : null}
    {methods.data ? <LoginMethodsTable methods={methods.data.methods} onAction={(action, method) => { if (action === "verify") setVerifyMethod(method); else setChange({ action, method }); }} /> : null}
    {mobile ? <div className="col-span-full flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setAddOpen(true)}><Plus size={16} />{t("account:add")}</Button>{methods.data?.canLinkGoogle ? <AccountGoogleButton /> : null}</div> : null}
    <div className="col-span-full my-1 h-px bg-[var(--borde)]" />
    <h2 className="col-span-full mt-1 text-[15px] font-semibold">{t("account:privacy")}</h2>
    <div className="col-span-full flex items-center justify-between gap-3 rounded-xl border border-[var(--borde)] px-3 py-2.5"><span>{t("account:deletion")}</span><Button type="button" variant="destructive" size="sm" onClick={() => setDeletionOpen(true)}>{t("account:requestDeletion")}</Button></div>
  </AccountProfileForm>
  {addOpen ? <AddLoginMethodDialog open onOpenChange={setAddOpen} onComplete={refresh} /> : null}
  {verifyMethod ? <VerifyLoginMethodDialog method={verifyMethod} open onOpenChange={(open) => { if (!open) setVerifyMethod(null); }} onComplete={refresh} /> : null}
  {change ? <ChangeLoginMethodDialog {...change} onClose={() => setChange(null)} onComplete={refresh} /> : null}
  {deletionOpen && methods.data ? <AccountDeletionDialog graceDays={methods.data.accountDeletionGraceDays} onClose={() => setDeletionOpen(false)} onComplete={(scheduled) => { void deleted(scheduled); }} /> : null}
  </>;
}
