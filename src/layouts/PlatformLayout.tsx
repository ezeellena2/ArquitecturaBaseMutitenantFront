import type { ReactNode } from "react";
import { RecentAuthenticationHost } from "@/shared/platform/RecentAuthenticationDialog";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { useNavigation } from "./navigation/useNavigation";

export function PlatformLayout({ children }: { children?: ReactNode }) {
  const navigation = useNavigation("platform");
  // E9: «Confirmá que sos vos» vale para toda escritura sensible de Plataforma, también la de un módulo.
  return <><PrivateLayoutFrame navigation={navigation} scope="platform">{children}</PrivateLayoutFrame><RecentAuthenticationHost /></>;
}
