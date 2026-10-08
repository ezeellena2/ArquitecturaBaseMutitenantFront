import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { List, ListItem } from "@/shared/ui/List";
import { AccountProfileForm } from "../components/AccountProfileForm";
import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { accountMethodsQueryKey, fetchLoginMethods } from "@/shared/account/api/loginMethods";
import { LoginMethodsTable } from "../components/LoginMethodsTable";
import { PersonalLoginMethodNotice } from "@/shared/account/PersonalLoginMethodNotice";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Section } from "@/shared/ui/Section";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { AccountLoginMethod } from "@/shared/api/types";
import { AddLoginMethodDialog } from "@/shared/account/AddLoginMethodDialog";
import { useHasLoginChannel } from "@/shared/account/useLoginChannels";
import { VerifyLoginMethodDialog } from "../components/VerifyLoginMethodDialog";
import { ChangeLoginMethodDialog } from "@/shared/account/ChangeLoginMethodDialog";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { toastError } from "@/shared/ui/sonner";
import { useAuth } from "react-oidc-context";
import { showDeletionRequested } from "@/auth/deletionRequestStatus";
import { useFormat } from "@/shared/format/useFormat";
import { AccountDeletionDialog } from "../components/AccountDeletionDialog";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { InfoButton } from "@/shared/ui/InfoButton";

export function AccountPage() {
  const { t } = useTranslation();
  const { data, isPending, refetch } = useCurrentUser();
  // Los métodos muestran su error en la caja, con «Reintentar»: sin aviso abajo que lo repita.
  const methods = useQuery({ queryKey: accountMethodsQueryKey, queryFn: fetchLoginMethods, meta: { silent: true } });
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const whatsApp = useHasLoginChannel("whatsapp");
  const [verifyMethod, setVerifyMethod] = useState<AccountLoginMethod | null>(null);
  const [change, setChange] = useState<{ action: "remove" | "primary"; method: AccountLoginMethod; returnFocus?: HTMLButtonElement | null } | null>(null);
  const [params, setParams] = useSearchParams();
  const handledGoogle = useRef(false);
  const auth = useAuth();
  const format = useFormat();
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionBlockedOpen, setDeletionBlockedOpen] = useState(false);
  // Tablero Cuenta, «Es la única Dueña»: «Dar de baja» apagado; la ⓘ y el botón explican por qué.
  const soleOwnerOf = methods.data?.soleOwnerOrganizations.join(", ") ?? "";
  const deletionBlocked = soleOwnerOf.length > 0;
  // Después de cambiar un método de ingreso: los métodos y la cuenta (el correo principal). La versión de «Tus datos» no
  // cambia: es la del perfil, que solo sube al guardarlo.
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
  // «Criterio · Avisos» (Pantalla de error): sin /api/me no hay nada que mostrar (LegalAcceptanceGate lo ve primero).
  if (!data) return <LoadErrorPage onRetry={() => { void refetch(); }} />;
  return <><AccountProfileForm key={data.id} account={data}>
    {/* Tablero M-Cuenta: en el teléfono, «Agregar correo o teléfono» en texto a la derecha del título. Sin el módulo de
        WhatsApp (tablero Cuenta, «Sin el módulo de WhatsApp»), «Agregar correo». */}
    <Section title={t("account:methods")} action={{ label: t(whatsApp ? "account:add" : "account:addEmail"), onClick: () => setAddOpen(true) }}>
      {methods.data?.needsPersonalLoginMethod ? <div className="border-b border-[var(--borde)] p-3"><PersonalLoginMethodNotice onAdd={() => setAddOpen(true)} /></div> : null}
      {methods.isPending ? <p className="p-4 text-[13px] text-[var(--t2)]" role="status">{t("states.loading")}</p> : null}
      {methods.error ? <div className="p-4"><FormError message={apiErrorMessage(methods.error, t)} /><Button type="button" onClick={() => { void methods.refetch(); }}>{t("actions.retry")}</Button></div> : null}
      {methods.data ? <LoginMethodsTable methods={methods.data.methods} canLinkGoogle={methods.data.canLinkGoogle} onAction={(action, method, returnFocus) => { if (action === "verify") setVerifyMethod(method); else setChange({ action, method, returnFocus }); }} /> : null}
    </Section>
    <Section title={t("account:privacy")}>
      <List label={t("account:privacy")}>
        <ListItem icon={<Trash2 aria-hidden="true" />} title={<span className="inline-flex items-center gap-1.5">{t("account:deletion")}
          {deletionBlocked ? <InfoButton label={t("account:deletionBlockedInfo")} onClick={() => setDeletionBlockedOpen(true)} /> : null}
        </span>}>
          <Button type="button" variant="danger" size="sm" className={deletionBlocked ? "opacity-50" : undefined}
            disabled={!methods.data || methods.isPending} aria-disabled={deletionBlocked || undefined}
            onClick={() => { if (deletionBlocked) setDeletionBlockedOpen(true); else setDeletionOpen(true); }}>{t("account:requestDeletion")}</Button>
        </ListItem>
      </List>
    </Section>
  </AccountProfileForm>
  {addOpen ? <AddLoginMethodDialog open onOpenChange={(open) => { setAddOpen(open); if (!open) refresh(); }} onComplete={refresh} /> : null}
  {verifyMethod ? <VerifyLoginMethodDialog method={verifyMethod} open onOpenChange={(open) => { if (!open) { setVerifyMethod(null); refresh(); } }} onComplete={refresh} /> : null}
  {change ? <ChangeLoginMethodDialog {...change} onClose={() => { setChange(null); refresh(); }} onComplete={refresh} /> : null}
  {/* Tablero Cuenta (única Dueña): el aviso importante compartido. */}
  <ImportantNotice open={deletionBlockedOpen} onOpenChange={setDeletionBlockedOpen} title={t("account:deletionBlockedTitle")}
    reason={t("account:deletionBlockedReason", { organizations: soleOwnerOf })}
    steps={[t("account:deletionBlockedStep1", { organizations: soleOwnerOf }), t("account:deletionBlockedStep2")]} />
  {deletionOpen && methods.data ? <AccountDeletionDialog graceDays={methods.data.accountDeletionGraceDays} onClose={() => setDeletionOpen(false)} onComplete={(scheduled) => { void deleted(scheduled); }} /> : null}
  </>;
}
