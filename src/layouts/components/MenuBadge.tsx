import type { ModuleBadge } from "@/shared/modules/types";
import { NumberText } from "@/shared/ui/format/NumberText";

/// El contador de una opción del menú o de un panel («WhatsApp 2», `.w-ln .cnt` de los tableros): a la derecha, en 12 y
/// petróleo. Con el menú contraído queda solo para el lector. El espacio de adelante separa el número del rótulo en el nombre
/// accesible («Chats 2»); en la fila, que es flex, no ocupa lugar.
export function MenuBadge({ Badge, hidden = false }: { Badge?: ModuleBadge; hidden?: boolean }) {
  if (!Badge) return null;
  return <Badge>{(count) => <>{" "}<span className={hidden ? "sr-only" : "ml-auto text-[12px] font-semibold text-[var(--marca-tx)]"}><NumberText value={count} /></span></>}</Badge>;
}
