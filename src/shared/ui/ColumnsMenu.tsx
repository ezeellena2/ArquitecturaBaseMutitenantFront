import { useTranslation } from "react-i18next";
import { Picker } from "./Picker";

export interface ColumnChoice {
  readonly id: string;
  readonly label: string;
}

/**
 * «Columnas» (FRM-Catalogo-13, estado «Columnas»): el botón de la barra de una tabla que abre la pieza múltiple (`Picker`,
 * 262) con una casilla por columna que se puede ocultar; marcar no cierra. En el teléfono la lista ocupa la pantalla y se
 * aplica con «Listo (N)». Las columnas fijas de la tabla no están acá: siempre se ven. Lo elegido lo guarda quien la usa, en
 * la URL (`useHiddenColumns`).
 */
export function ColumnsMenu({ columns, hidden, onHiddenChange, className }: {
  columns: readonly ColumnChoice[];
  /** Las ocultas, por su id. */
  hidden: readonly string[];
  onHiddenChange: (hidden: string[]) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const visible = columns.filter((column) => !hidden.includes(column.id)).map((column) => column.id);
  return <Picker multiple trigger="button" label={t("columnsMenu.title")} triggerLabel={t("columnsMenu.title")} className={className}
    options={columns.map((column) => ({ value: column.id, label: column.label }))} value={visible}
    onChange={(next) => onHiddenChange([
      // Las ocultas que no son de esta lista (una columna que ya no está) se conservan: el enlace no cambia solo.
      ...hidden.filter((id) => !columns.some((column) => column.id === id)),
      ...columns.filter((column) => !next.includes(column.id)).map((column) => column.id),
    ])} />;
}
