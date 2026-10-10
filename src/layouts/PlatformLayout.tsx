import type { ReactNode } from "react";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { useNavigation } from "./navigation/useNavigation";

export function PlatformLayout({ children }: { children?: ReactNode }) {
  const navigation = useNavigation("platform");
  return <PrivateLayoutFrame navigation={navigation} scope="platform">{children}</PrivateLayoutFrame>;
}
