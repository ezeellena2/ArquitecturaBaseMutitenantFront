import type { ModuleContentProps } from "@/shared/modules/types";
import { ChatsWorkspace } from "../components/ChatsWorkspace";

/// WhatsApp › Chats de la organización (WA-Chats y sus estados; M-WA-Chats y M-WA-Conversacion en el teléfono).
export function ChatsPage({ me }: ModuleContentProps) {
  return <ChatsWorkspace me={me} variant="organization" />;
}

/// Plataforma › WhatsApp › Consultas (Plat-WA-Chats; M-Plat-WA-Chats y M-Plat-WA-Conversacion): las mismas acciones, sin
/// bandejas, con «Ver la cuenta» para quien puede leer cuentas.
export function PlatformChatsPage({ me }: ModuleContentProps) {
  return <ChatsWorkspace me={me} variant="platform" />;
}
