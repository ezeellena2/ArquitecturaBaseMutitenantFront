import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { CompanySelect, wholeOrganization } from "./CompanySelect";

/// WA-Alta («Atiende a» y «Atiende a · elegir») y M-WA-Alta: antes de abrir la ventana de Meta se elige a quién va a
/// atender el número; «Seguir en Meta» la abre. Se monta solo abierto.
export function ConnectNumberDialog({ onContinue, onClose }: {
  onContinue: (companyId: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const [company, setCompany] = useState(wholeOrganization);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent size="sm" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{t("whatsapp:numbers.connect.title")}</DialogTitle></DialogHeader>
      <DialogBody>
        <FormField label={t("whatsapp:numbers.connect.company")}>
          <CompanySelect value={company} onChange={setCompany} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
        <Button type="button" onClick={() => onContinue(company === wholeOrganization ? null : company)}>{t("whatsapp:numbers.connect.continue")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
