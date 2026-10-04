import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";
import { accountMethodsQueryKey } from "./api/loginMethods";

/// Avisa que falta un método de ingreso propio. «Agregar» abre «Agregar correo o teléfono» ahí mismo, como el
/// tablero Inicio-Personal; Mi cuenta pasa `onAdd` para abrir su propio diálogo.
export function PersonalLoginMethodNotice({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation("account");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: accountMethodsQueryKey });
    void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }

  return <>
    <Banner tone="warning" action={<Button type="button" variant="outline" size="sm" onClick={onAdd ?? (() => setOpen(true))}>{t("addShort")}</Button>}>
      {t("noOwn")}
    </Banner>
    {open ? <AddLoginMethodDialog open onOpenChange={setOpen} onComplete={refresh} /> : null}
  </>;
}
