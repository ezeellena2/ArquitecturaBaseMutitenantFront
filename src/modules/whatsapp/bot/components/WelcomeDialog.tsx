import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/textarea";
import type { BotPatch } from "../lib/botModel";
import { useBotDialogSave } from "./useBotDialogSave";

const textLimit = validationConstraints.UpdateWhatsAppBotHttpRequest.welcome.maxLength;

/// «Bienvenida» (WA-Respuestas, «Editar bienvenida», y M-WA-Respuestas): el texto que manda el bot la primera vez que
/// alguien escribe. No tiene interruptor: el bot no se apaga (D9).
export function WelcomeDialog({ welcome, onSave, onClose, returnFocusTo }: { welcome: string; onSave: (patch: BotPatch) => Promise<unknown>; onClose: () => void; returnFocusTo?: HTMLElement | null }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const schema = z.object({ text: z.string().trim().min(1, t("whatsapp:bot.validation.required")).max(textLimit) });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { text: welcome } });
  const { failure, clear, close, pending, submit } = useBotDialogSave(onSave, onClose);
  const send = form.handleSubmit((values) => submit({ welcome: values.text.trim() }));

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("whatsapp:bot.welcome.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { void send(event); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <FormField label={t("whatsapp:bot.text")} required error={form.formState.errors.text?.message}>
            <Textarea rows={4} maxLength={textLimit} {...form.register("text", { onChange: clear })} />
          </FormField>
          <FormError message={actionErrorMessage(failure, t)} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
          <Button type="submit" disabled={!form.formState.isDirty} pending={pending}>{t(phone ? "common:actions.save" : "whatsapp:bot.saveChanges")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
