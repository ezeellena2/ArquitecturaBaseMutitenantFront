import { User } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui/Avatar";
import { initialsOf } from "../lib/conversation";

const sizes = {
  // WA-Chats (.w-av): 32 en la bandeja y en el encabezado del hilo.
  default: "size-8 text-[0.75rem]",
  // M-WA-Chats (.ap .w-av): 44 en la fila de la lista del teléfono.
  row: "size-11 text-[0.9375rem]",
  // M-WA-Conversacion (.ap-cbar .w-av): 38 en la barra del chat.
  bar: "size-9.5 text-[0.875rem]",
} as const;

/// El círculo del contacto: sus iniciales con el degradé de la marca o, si no se sabe quién es (solo el número), el gris
/// con la silueta (`.w-av.g`).
export function ChatAvatar({ name, size = "default" }: { name?: string | null; size?: keyof typeof sizes }) {
  if (name) return <Avatar initials={initialsOf(name)} className={sizes[size]} />;
  return <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]", sizes[size])}>
    <User className="size-[55%]" strokeWidth={1.75} />
  </span>;
}

/// El cuadrado de la organización en «Mensajes» de la persona (WA-Mensajes, .o-av): sus iniciales sobre arena.
export function OrganizationAvatar({ name, size = "default" }: { name: string; size?: keyof typeof sizes }) {
  return <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-[0.5rem] bg-[var(--cab)] font-bold text-[var(--t2)]", sizes[size],
    size === "row" ? "rounded-full" : null)}>{initialsOf(name)}</span>;
}
