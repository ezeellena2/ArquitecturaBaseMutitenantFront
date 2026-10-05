import { Fragment, type ReactNode } from "react";

export interface DetailGridItem { key: string; label: ReactNode; value: ReactNode }

/** La grilla de detalle de Auditoría. Quien la usa entrega los rótulos traducidos y los datos ya formateados. */
export function DetailGrid({ items, phone = false }: { items: readonly DetailGridItem[]; phone?: boolean }) {
  if (phone) return <dl className="flex flex-col px-5 pt-2 pb-4 leading-[normal]">
    {items.map((item) => <div key={item.key} className="flex flex-col gap-0.5 border-t border-[var(--borde)] py-2.5 first:border-t-0">
      <dt className="text-[13px] text-[var(--t3)]">{item.label}</dt>
      <dd className="min-w-0 text-[15.5px] font-medium text-[var(--t1)]">{item.value}</dd>
    </div>)}
  </dl>;

  return <div className="px-5 pb-5 pt-4"><dl className="grid grid-cols-[170px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-[var(--borde)] text-[13.5px] leading-[1.45] text-[var(--t1)] [&>:nth-child(-n+2)]:border-t-0">
    {items.map((item) => <Fragment key={item.key}>
      <dt className="border-r border-t border-[var(--borde)] bg-[var(--s2)] px-3.5 py-2.5 font-medium text-[var(--t2)]">{item.label}</dt>
      <dd className="min-w-0 break-words border-t border-[var(--borde)] px-3.5 py-2.5">{item.value}</dd>
    </Fragment>)}
  </dl></div>;
}
