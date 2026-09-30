export function BrandMark({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return <span aria-hidden="true" className={`brand-mark relative inline-flex shrink-0 bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] shadow-[0_2px_6px_-1px_var(--marca-sombra)] ${compact ? "size-6 rounded-[7px]" : "size-7 rounded-[8px]"} ${className}`}>
    <span className="absolute inset-2 -rotate-45 rounded-[3px] border-[2.5px] border-[var(--lado-activo)] border-r-transparent" />
  </span>;
}
