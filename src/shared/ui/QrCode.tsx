import qrcode from "qrcode-generator";
import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";

/// Un código QR armado en el navegador (tablero Ingreso, `.qr`): el contenido no sale a ningún servicio ni a la URL.
/// Cada módulo oscuro es un cuadrado del mismo trazo, con un módulo de margen, sobre blanco también en el modo oscuro,
/// para que lo lea la cámara.
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let squares = "";
    for (let row = 0; row < count; row++) {
      for (let column = 0; column < count; column++) if (qr.isDark(row, column)) squares += `M${column} ${row}h1v1h-1z`;
    }
    return { size: count, path: squares };
  }, [value]);
  return <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} role="img" aria-label={label} shapeRendering="crispEdges"
    className={cn("shrink-0 rounded-[14px] border border-[var(--borde)] bg-[var(--lado-activo)] p-2.5 text-[var(--t1)]", className)}>
    <path d={path} fill="currentColor" />
  </svg>;
}
