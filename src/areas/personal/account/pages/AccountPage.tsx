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
import { CircleAlert, Info, Plus, Trash2 } from "lucide-react";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { AccountLoginMethod } from "@/shared/api/types";
import { AddLoginMethodDialog } from "../components/AddLoginMethodDialog";
import { VerifyLoginMethodDialog } from "../components/VerifyLoginMethodDialog";
import { ChangeLoginMethodDialog } from "../components/ChangeLoginMethodDialog";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { toastError } from "@/shared/ui/sonner";
import { useAuth } from "react-oidc-context";
import { showDeletionRequested } from "@/auth/deletionRequestStatus";
import { useFormat } from "@/shared/format/useFormat";
import { AccountDeletionDialog } from "../components/AccountDeletionDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

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
  const [deletionBlockedOpen, setDeletionBlockedOpen] = useState(false);
  // Tablero Cuenta, «Es la única Dueña»: «Dar de baja» apagado; la ⓘ y el botón explican por qué.
  const soleOwnerOf = methods.data?.soleOwnerOrganizations.join(", ") ?? "";
  const deletionBlocked = soleOwnerOf.length > 0;
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
      toastError(t(`account:${key}`));
    }
    const clean = new URLSearchParams(params); clean.delete("google"); clean.delete("error"); setParams(clean, { replace: true });
  });
  if (isPending) return <p role="status" className="p-4 text-[13px] lg:px-6 lg:py-5">{t("states.loading")}</p>;
  if (!data) return <div className="flex flex-col gap-3.5 p-4 text-[13px] lg:px-6 lg:py-5"><FormError message={error instanceof Error ? error.message : t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  return <><AccountProfileForm key={data.id} account={data}>
    <section role="region" aria-labelledby="account-methods-title" className="overflow-hidden rounded-[12px] border border-[var(--borde)] bg-[var(--lado-activo)]">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
        <h2 id="account-methods-title">{t("account:methods")}</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />{t(mobile ? "account:addShort" : "account:add")}</Button>
      </header>
      {methods.data?.needsPersonalLoginMethod ? <div className="border-b border-[var(--borde)] p-3"><PersonalLoginMethodNotice onAdd={() => setAddOpen(true)} /></div> : null}
      {methods.isPending ? <p className="p-4 text-[13px] text-[var(--t2)]" role="status">{t("states.loading")}</p> : null}
      {methods.error ? <div className="p-4"><FormError message={methods.error.message} /><Button type="button" onClick={() => { void methods.refetch(); }}>{t("actions.retry")}</Button></div> : null}
      {methods.data ? <LoginMethodsTable methods={methods.data.methods} canLinkGoogle={methods.data.canLinkGoogle} onAction={(action, method) => { if (action === "verify") setVerifyMethod(method); else setChange({ action, method }); }} /> : null}
    </section>
    <section role="region" aria-labelledby="account-privacy-title" className="overflow-hidden rounded-[12px] border border-[var(--borde)] bg-[var(--lado-activo)]">
      <header className="flex min-h-10 items-center border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
        <h2 id="account-privacy-title">{t("account:privacy")}</h2>
      </header>
      <div className="flex min-h-14 items-center gap-3 border-b border-[var(--borde)] px-4 py-2">
        <Trash2 size={16} className="shrink-0 text-[var(--t2)]" aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="inline-flex items-center gap-1.5 font-medium">{t("account:deletion")}
            {deletionBlocked ? <button type="button" aria-label={t("account:deletionBlockedInfo")} title={t("account:deletionBlockedInfo")} onClick={() => setDeletionBlockedOpen(true)}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--peligro)] hover:bg-[var(--peligro-t)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]"><Info aria-hidden="true" className="size-4" /></button> : null}
          </span>
          {methods.data && !deletionBlocked ? <span className="text-[13px] text-[var(--t3)]">{t("account:deletionGrace", { days: methods.data.accountDeletionGraceDays })}</span> : null}
        </span>
        <Button type="button" variant="danger" size="sm" className={deletionBlocked ? "opacity-50" : undefined}
          disabled={!methods.data || methods.isPending} aria-disabled={deletionBlocked || undefined}
          onClick={() => { if (deletionBlocked) setDeletionBlockedOpen(true); else setDeletionOpen(true); }}>{t("account:requestDeletion")}</Button>
      </div>
    </section>
  </AccountProfileForm>
  {addOpen ? <AddLoginMethodDialog open onOpenChange={setAddOpen} onComplete={refresh} /> : null}
  {verifyMethod ? <VerifyLoginMethodDialog method={verifyMethod} open onOpenChange={(open) => { if (!open) setVerifyMethod(null); }} onComplete={refresh} /> : null}
  {change ? <ChangeLoginMethodDialog {...change} onClose={() => setChange(null)} onComplete={refresh} /> : null}
  {/* Aviso importante (Criterio-Avisos): el motivo destacado en rojo suave y «Qué podés hacer» en pasos. */}
  <Dialog open={deletionBlockedOpen} onOpenChange={setDeletionBlockedOpen}>
    <DialogContent className="md:max-w-[420px]" showCloseButton>
      <DialogHeader><DialogTitle>{t("account:deletionBlockedTitle")}</DialogTitle></DialogHeader>
      <div className="flex flex-col gap-3 px-5 py-4 text-[13px]">
        {/* Tablero Cuenta (única Dueña): aviso en bordó y negrita; pasos con el número en un círculo gris relleno. */}
        <div className="flex items-start gap-3 rounded-[10px] bg-[var(--peligro-t)] px-4 py-3.5 text-[var(--peligro-tx)]">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <strong className="text-[15px] font-semibold">{t("account:deletionBlockedReason", { organizations: soleOwnerOf })}</strong>
        </div>
        <span className="text-[12.5px] font-semibold text-[var(--t3)]">{t("account:whatCanYouDo")}</span>
        <ol className="flex flex-col gap-2.5">
          {[t("account:deletionBlockedStep1", { organizations: soleOwnerOf }), t("account:deletionBlockedStep2")].map((step, index) => <li key={step} className="flex items-center gap-2.5 text-[13.5px] text-[var(--t1)]">
            <span aria-hidden="true" data-step-number className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[12px] font-semibold text-[var(--t2)]">{index + 1}</span>{step}
          </li>)}
        </ol>
      </div>
      <DialogFooter><Button type="button" onClick={() => setDeletionBlockedOpen(false)}>{t("account:understood")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
  {deletionOpen && methods.data ? <AccountDeletionDialog graceDays={methods.data.accountDeletionGraceDays} onClose={() => setDeletionOpen(false)} onComplete={(scheduled) => { void deleted(scheduled); }} /> : null}
  </>;
}
