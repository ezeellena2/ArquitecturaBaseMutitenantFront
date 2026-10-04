import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { cn } from "@/shared/lib/utils";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";
import { accountMethodsQueryKey } from "./api/loginMethods";

/// Avisa que falta un método de ingreso propio. «Agregar» abre «Agregar correo o teléfono» ahí mismo, como el
/// tablero Inicio-Personal; Mi cuenta pasa `onAdd` para abrir su propio diálogo. En el teléfono (tablero
/// M-Inicio-Personal, .ap-sug) es una tarjeta petróleo clara con «Agregar» como botón principal.
export function PersonalLoginMethodNotice({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  const { t } = useTranslation("account");
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: accountMethodsQueryKey });
    void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }

  const dialog = open ? <AddLoginMethodDialog open onOpenChange={setOpen} onComplete={refresh} /> : null;
  if (phone) return <>
    <div role="status" className={cn("flex flex-col gap-3 rounded-[16px] bg-[var(--marca-t)] p-4", className)}>
      <p className="text-[15px] leading-normal text-[var(--sugerencia-tx)]">{t("noOwn")}</p>
      <Button type="button" className="h-10 self-start rounded-[10px] px-[18px] text-[15px]" onClick={onAdd ?? (() => setOpen(true))}>{t("addShort")}</Button>
    </div>
    {dialog}
  </>;

  return <>
    <Banner tone="warning" action={<Button type="button" variant="outline" size="sm" onClick={onAdd ?? (() => setOpen(true))}>{t("addShort")}</Button>}>
      {t("noOwn")}
    </Banner>
    {dialog}
  </>;
}
