export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span aria-hidden="true" className={`brand-mark inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] shadow-[var(--shadow-card)] ${compact ? "size-6 rounded-[7px]" : "size-7 rounded-[8px]"}`}>
    <svg className={`${compact ? "size-4" : "size-[18px]"} text-[var(--lado-activo)]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
  </span>;
}
