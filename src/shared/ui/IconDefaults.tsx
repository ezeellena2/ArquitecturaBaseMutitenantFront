import { LucideProvider } from "lucide-react";
import type { ReactNode } from "react";

/// El trazo de los íconos de lucide, el de los tableros (1.75, como el set propio de `icons.tsx`). Va una sola vez, en la
/// raíz de la app; un ícono que pide otro trazo lo sigue pidiendo.
export function IconDefaults({ children }: { children: ReactNode }) {
  return <LucideProvider strokeWidth={1.75}>{children}</LucideProvider>;
}
