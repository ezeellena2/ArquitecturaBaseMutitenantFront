import type { ReactNode } from "react";

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function Icon({ className, strokeWidth = 1.75, children }: IconProps & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className}>{children}</svg>;
}

/// «Chats» del panel WhatsApp (WA-Chats) y «Mensajes» del perfil personal (WA-Mensajes): el globo con su cola.
export function ChatsIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" /></Icon>;
}

/// «Contactos» del panel WhatsApp (WA-Chats): dos personas.
export function ContactsIcon(props: IconProps) {
  return <Icon {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19" />
  </Icon>;
}

/// «Difusiones» del panel WhatsApp (WA-Chats): el altavoz.
export function BroadcastsIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 10v4h3l6 4V6L7 10z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></Icon>;
}

/// «Chats», «Consultas» y «Mensajes» en la barra del teléfono (M-WA-Chats, M-Mas-Plat y M-WA-Mensajes): el globo de WhatsApp.
export function AppChatsIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" /></Icon>;
}
