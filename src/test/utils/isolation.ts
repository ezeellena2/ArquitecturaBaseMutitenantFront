import { cleanup } from "@testing-library/react";
import { toast } from "sonner";
import { clearAccessError } from "@/shared/api/accessErrorStore";

/// Lo que una prueba deja en módulos compartidos y la siguiente no tiene que ver:
/// - el bloqueo de la vista (403 de una consulta principal, términos nuevos) vive en un store del módulo: primero se
///   desmonta lo de la prueba; si no, al limpiar la pantalla bloqueada vuelve a montarse, repite la consulta y publica
///   de nuevo;
/// - los avisos: sonner los guarda fuera de React y, al montar el Toaster de la prueba siguiente, vuelve a mostrar los
///   que siguen abiertos (los rojos no se van solos y los demás duran más que una prueba).
export function resetBetweenTests(): void {
  cleanup();
  clearAccessError();
  toast.dismiss();
}
