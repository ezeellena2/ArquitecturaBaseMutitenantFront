/// 210 («Criterio · Avisos», Avisos según el tipo): el fondo nunca dice el tipo. Todo aviso es blanco, con la tinta de
/// siempre, y el tipo va en un filo de 3 a la izquierda y en el ícono, del mismo color: lo que salió bien en verde con
/// tilde, información en gris con (i), atención en ámbar con triángulo y error en rojo con octógono. Lo usan la franja de
/// un formulario (`FormError`), el cartel (`Banner`), la banda del teléfono (`PhoneBand`) y el cartel de «Sin conexión».
/// El aviso de abajo (sonner) lo pinta `index.css`, con los mismos colores. Un aviso nuevo usa una de estas formas.
export type NoticeTone = "success" | "info" | "warning" | "danger";

/// La caja blanca de un aviso, con el borde de las cajas y el filo de 3 a la izquierda (sin su color: va en `noticeTones`).
/// El filo mide 3 también en la compu, como una línea (tema.md, Forma).
export const noticeSurface = "border border-l-[3px] border-[var(--borde)] bg-[var(--superficie)] text-[var(--t1)]";

/// El color del filo y del ícono de cada tipo.
export const noticeTones: Record<NoticeTone, { edge: string; icon: string }> = {
  success: { edge: "border-l-[var(--aviso-ok)]", icon: "text-[var(--aviso-ok)]" },
  info: { edge: "border-l-[var(--t2)]", icon: "text-[var(--t2)]" },
  warning: { edge: "border-l-[var(--alerta)]", icon: "text-[var(--alerta)]" },
  danger: { edge: "border-l-[var(--peligro)]", icon: "text-[var(--peligro)]" },
};
