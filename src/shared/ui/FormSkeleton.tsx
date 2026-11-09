import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { loadingBlock } from "./PageLoading";

/// Mientras carga un ajuste («Criterio · Formularios», «Un ajuste», 160): dibuja sus zonas, cada una con su encabezado
/// arena y, en dos columnas iguales, el rótulo y el control de cada campo como bloques de carga. Va adentro de su página,
/// con el título en la banda y sin los botones de la banda. En el teléfono, una columna.
export function FormSkeleton({ zones = 2, fields = 2 }: { zones?: number; fields?: number }) {
  const { t } = useTranslation();

  return <div role="status" aria-label={t("states.loading")} data-slot="form-skeleton" className="flex flex-col gap-3.5">
    {Array.from({ length: zones }, (_, zone) => <div key={zone} data-slot="form-skeleton-zone"
      className="overflow-hidden rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)]">
      <div className="flex min-h-10 items-center border-b border-[var(--borde-cab)] bg-[var(--cab)] px-4">
        <span className={cn(loadingBlock, "h-3 w-30")} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-5 pt-4 pb-5 max-md:grid-cols-1">
        {Array.from({ length: fields }, (_, field) => <div key={field} data-slot="form-skeleton-field" className="flex flex-col gap-1.5">
          <span className={cn(loadingBlock, "h-2.5 w-22.5")} />
          <span className={cn(loadingBlock, "h-9 rounded-[0.5rem]")} />
        </div>)}
      </div>
    </div>)}
  </div>;
}
