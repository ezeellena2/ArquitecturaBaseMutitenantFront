import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { effectiveCulture } from "@/shared/i18n";
import { DateText } from "@/shared/ui/format/DateText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { getLegalDocument, legalDocumentQueryKey, type LegalKind } from "../api/legal";

export function LegalDocumentPage({ kind }: { kind: LegalKind }) {
  const { t } = useTranslation("legal");
  const culture = effectiveCulture();
  const { data, isError, error } = useQuery({
    queryKey: legalDocumentQueryKey(kind, culture ?? ""),
    queryFn: () => getLegalDocument(kind),
    enabled: culture !== null,
    meta: { silent: true },
  });
  if (isError) throw error;
  if (!data) return null;

  const title = t(`documents.${kind}`);
  return <div className="min-h-[calc(100dvh-220px)] py-6 md:py-10">
    <div className="mx-auto flex max-w-[760px] flex-col px-4 md:px-10">
      <h1 className="text-[22px] leading-[1.2] font-bold tracking-[-0.02em] md:text-[28px]">{title}</h1>
      <p className="mt-2 text-[13px] text-[var(--t2)] md:text-sm"><Trans i18nKey="meta" ns="legal" components={{ version: <NumberText value={data.version} />, date: <DateText value={data.effectiveAtUtc} /> }} /></p>
      <article aria-label={title} className="mt-5 min-h-[250px] whitespace-pre-wrap border-t border-[var(--borde)] pt-5 text-[var(--t1)] md:mt-7 md:pt-7">{data.text}</article>
    </div>
  </div>;
}
