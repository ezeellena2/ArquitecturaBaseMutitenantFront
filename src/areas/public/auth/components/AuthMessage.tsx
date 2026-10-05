import type { ReactNode } from "react";
import { FormError } from "@/shared/ui/FormError";

export interface AuthMessageContent {
  text: ReactNode;
  /** Las líneas que completan el mensaje: «Te quedan 3 intentos.», «Probá de nuevo en 15 minutos.». */
  details?: readonly ReactNode[];
  /** La de atención («Esperá un momento…») es ámbar; las demás, rojas. */
  tone?: "danger" | "warning";
}

/// Un mensaje del ingreso, los registros o la invitación (.msj de los tableros), en la franja común: el texto y, debajo,
/// las líneas que lo completan.
export function AuthMessage({ message }: { message?: AuthMessageContent | null }) {
  return <FormError tone={message?.tone} message={message ? <>
    {message.text}
    {message.details?.map((detail, index) => <span key={index} className="block">{detail}</span>)}
  </> : null} />;
}
