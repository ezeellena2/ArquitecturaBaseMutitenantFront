// «Criterio · Menús y desplegables»: el menú lateral y el panel de Administración usan las mismas opciones, de 32 con
// ícono de 18; la opción en la que estás, en blanco con letra petróleo, y las demás, en el gris del marco.
const rowBase = "flex min-h-[32px] items-center gap-2.5 rounded-[8px] px-2.5 text-[13px]";

export const menuRowClass = (active: boolean) => `${rowBase} ${active
  ? "bg-[var(--lado-activo)] font-semibold text-[var(--marca-tx)] ring-1 ring-[var(--borde)] shadow-sm"
  : "text-[var(--lado-t2)] hover:bg-[var(--lado-hover)] hover:text-[var(--t1)]"}`;

/// El grupo que se despliega en el lugar («Gestión de usuarios»), en negrita y en el color del texto.
export const menuGroupClass = `${rowBase} font-semibold text-[var(--t1)] hover:bg-[var(--lado-hover)]`;

/// Una línea fina entre cada opción, como la que separa Administración. Va adentro de los 2 px que separan las opciones
/// (la lista lleva `gap-0.5`), así que no suma alto: 34 de una opción a la otra (v92).
export const menuLineClass = (index: number) => index > 0
  ? "relative before:absolute before:inset-x-0 before:-top-0.5 before:h-px before:bg-[var(--lado-borde)]"
  : "";

/// La flecha que achica el menú o cierra Administración (lienzo v107, «Criterio · Decisiones» y `.w-plegar` de los
/// tableros): blanca, redonda, de 28, con borde arena y su sombra, sobre el borde derecho del último panel, a 64 de arriba.
/// La lleva un solo panel: el de Administración si está abierto y, si no, el menú. Su flecha mide 18.
export const panelEdgeButtonClass = "absolute -right-3.5 top-16 z-30 flex size-7 items-center justify-center rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-[0_1px_3px_oklch(0.24_0.012_60/0.15)] hover:text-[var(--marca)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]";
