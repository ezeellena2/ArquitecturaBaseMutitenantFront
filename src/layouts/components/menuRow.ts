// «Criterio · Menús y desplegables»: el menú lateral y el panel de Administración usan las mismas opciones, de 32 con
// ícono de 18; la opción en la que estás, en blanco con letra petróleo, y las demás, en el gris del marco.
const rowBase = "flex min-h-[32px] items-center gap-2.5 rounded-[8px] px-2.5 text-[13px]";

export const menuRowClass = (active: boolean) => `${rowBase} ${active
  ? "bg-[var(--lado-activo)] font-semibold text-[var(--marca-tx)] ring-1 ring-[var(--borde)] shadow-sm"
  : "text-[var(--lado-t2)] hover:bg-[var(--lado-hover)] hover:text-[var(--t1)]"}`;

/// El grupo que se despliega en el lugar («Gestión de usuarios»), en negrita y en el color del texto.
export const menuGroupClass = `${rowBase} font-semibold text-[var(--t1)] hover:bg-[var(--lado-hover)]`;

/// Una línea fina entre cada opción, como la que separa Administración.
export const menuLineClass = (index: number) => index > 0 ? "border-t border-[var(--lado-borde)] pt-0.5" : "";
