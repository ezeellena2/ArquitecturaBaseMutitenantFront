export function BrandMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark relative inline-flex shrink-0 bg-gradient-to-br from-[var(--marca)] to-[var(--marca-2)] shadow-[0_2px_0.375rem_-1px_var(--marca-sombra)] size-7 rounded-[0.5rem] ${className}`}>
    <span className="absolute inset-2 -rotate-45 rounded-[0.1875rem] border-[0.15625rem] border-[var(--lado-activo)] border-r-transparent" />
  </span>;
}
