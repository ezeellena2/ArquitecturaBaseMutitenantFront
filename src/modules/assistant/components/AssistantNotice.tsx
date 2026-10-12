import { useTranslation } from "react-i18next";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";

export function AssistantNotice({ pending, error, onAccept, onPrivacy }: { pending: boolean; error: string | null; onAccept: () => void; onPrivacy: () => void }) {
  const { t } = useTranslation("assistant");
  const restore = useRestoreFocusOnClose();
  return <Dialog open><DialogContent size="sm" showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()} onCloseAutoFocus={restore}>
    <DialogHeader><DialogTitle>{t("notice.title")}</DialogTitle></DialogHeader>
    <DialogBody><DialogDescription>{t("notice.body")}</DialogDescription>{error ? <p role="alert">{error}</p> : null}</DialogBody>
    <DialogFooter className="max-md:flex-col-reverse max-md:[&_button]:flex-none"><Button variant="outline" onClick={onPrivacy}>{t("notice.privacy")}</Button><Button pending={pending} pendingLabel={t("common:states.saving")} onClick={onAccept}>{t("notice.accept")}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
