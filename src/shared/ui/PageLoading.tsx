import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";

/// Un bloque de carga («Criterio · Marco», `.r711-blq`): la letra del tema al 8 %, con esquinas de 4.
export const loadingBlock = "block rounded-[0.25rem] bg-[var(--t1)]/8";

const bars = ["w-[80%]", "w-[65%]", "w-[72%]"] as const;

/// Mientras una página espera su ruta o sus permisos («Criterio · Marco», «Mientras carga una página», 160): la banda ya
/// está, con su alto y su borde, y el título es un bloque de carga; el cuerpo, tres barras. Así la pantalla no salta
/// cuando llegan. En el teléfono, la barra de arriba con el bloque del título. Nunca una página en blanco ni un aro suelto.
export function PageLoading() {
  const { t } = useTranslation();
  const { phone } = useAppChrome();

  return <div role="status" aria-label={t("states.loading")} data-slot="page-loading" className="flex min-h-full flex-1 flex-col">
    {phone ? <div data-slot="page-loading-band" className="flex h-15 shrink-0 items-center bg-[var(--superficie)] px-4">
      <span className={cn(loadingBlock, "h-5 w-40")} />
    </div> : <div data-slot="page-loading-band" className="flex min-h-16 shrink-0 flex-col justify-center gap-2 border-b border-[var(--borde)] bg-[var(--superficie)] px-4 py-2.5 md:px-6">
      <span className={cn(loadingBlock, "h-4 w-45")} />
      <span className={cn(loadingBlock, "h-2.5 w-65")} />
    </div>}
    <div className="flex flex-col gap-3.5 p-4 md:p-6">
      {bars.map((width) => <span key={width} data-slot="page-loading-bar" className={cn(loadingBlock, "h-3.5", width)} />)}
    </div>
  </div>;
}
