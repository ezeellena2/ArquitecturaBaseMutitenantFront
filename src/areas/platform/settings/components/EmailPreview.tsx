import { useTranslation } from "react-i18next";
import { isEmailLogoUrl } from "../lib/rules";

/**
 * «Así llega» (273, tablero Config-Plat-Base2, `.b2-correo`): el correo de un código con el nombre, el remitente y el
 * logo que se están editando, antes de guardarlos. El código y el plazo son de ejemplo.
 */
export function EmailPreview({ appName, senderName, logoUrl }: { appName: string; senderName: string; logoUrl: string }) {
  const { t } = useTranslation("platformSettings");
  const app = appName.trim(); const sender = senderName.trim(); const code = t("preview.code");
  return <div className="flex flex-col gap-2.5 lg:col-span-2">
    <p className="text-[0.8125rem] font-semibold text-[var(--t1)]">{t("preview.title")}</p>
    <div role="group" aria-label={t("preview.label")} className="rounded-[0.25rem] border border-[var(--borde)] bg-[var(--s2)] text-[0.8125rem]">
      <dl className="grid grid-cols-[4.375rem_minmax(0,1fr)] gap-x-2.5 gap-y-1 border-b border-[var(--borde)] px-3.5 py-2.5 text-[var(--t2)]">
        <dt>{t("preview.from")}</dt><dd className="min-w-0 font-medium break-words text-[var(--t1)]">{sender}</dd>
        <dt>{t("preview.subject")}</dt><dd className="min-w-0 font-medium break-words text-[var(--t1)]">{t("preview.subjectText", { code, app })}</dd>
      </dl>
      <div className="mx-auto my-4 max-w-115 rounded-[0.25rem] border border-[var(--borde)] bg-[var(--superficie)] px-6 py-5 leading-normal text-[var(--t1)] max-md:mx-3">
        <div className="mb-3.5 flex items-center gap-2 font-bold">
          {isEmailLogoUrl(logoUrl) ? <img src={logoUrl.trim()} alt="" className="h-6.5 max-w-40 object-contain" /> : null}
          <span className="min-w-0 break-words">{app}</span>
        </div>
        <p className="font-semibold">{t("preview.heading")}</p>
        <p className="mt-1.5">{t("preview.body", { app })}</p>
        <p className="my-3 text-[1.5rem] font-bold tracking-[4px]">{code}</p>
        <p className="text-[0.75rem] text-[var(--t2)]">{t("preview.note")}</p>
      </div>
    </div>
  </div>;
}
