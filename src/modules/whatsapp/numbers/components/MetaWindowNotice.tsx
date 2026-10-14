import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

/// «Ventana de Meta abierta» (WA-Alta-Meta, Plat-WA-Alta y sus M-*): mientras la ventana de Facebook está abierta, la
/// pantalla queda velada con un aviso abajo y dos salidas: volver a la ventana o cancelar. En el teléfono, una hoja sin
/// ✕. La ventana de Meta la dibuja Facebook: acá no se dibuja.
export function MetaWindowNotice({ onBack, onCancel }: { onBack: () => void; onCancel: () => void }) {
  const { t } = useTranslation("whatsapp");
  const { phone } = useAppChrome();
  if (phone) return <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
    <DialogContent showCloseButton={false} aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{t("numbers.metaWindow.open")}</DialogTitle></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t("numbers.metaWindow.cancel")}</Button>
        <Button type="button" onClick={onBack}>{t("numbers.metaWindow.back")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
  // WA-Alta-Meta (.mw-velo y .mw-pill): el velo sobre toda la pantalla y el aviso redondo, abajo al centro.
  return <div className="fixed inset-0 z-50 bg-[var(--velo)]">
    <div role="status" className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--lado-activo)] py-2.5 pr-3 pl-[18px] text-[13.5px] text-[var(--t1)] shadow-[var(--sombra-dialogo)]">
      <span className="whitespace-nowrap">{t("numbers.metaWindow.open")}</span>
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onBack}>{t("numbers.metaWindow.back")}</Button>
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onCancel}>{t("numbers.metaWindow.cancel")}</Button>
    </div>
  </div>;
}
