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
/// las líneas que lo completan, más claras.
export function AuthMessage({ message }: { message?: AuthMessageContent | null }) {
  return <FormError tone={message?.tone} message={message ? <>
    {message.text}
    {/* .sub2 de los tableros: la línea de abajo, a 2 del texto, en 13 y más clara. */}
    {message.details?.map((detail, index) => <span key={index} className="mt-0.5 block text-[13px] opacity-85">{detail}</span>)}
  </> : null} />;
}
