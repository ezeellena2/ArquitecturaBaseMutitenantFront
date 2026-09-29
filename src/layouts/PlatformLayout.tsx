import type { ReactNode } from "react";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { platformNavigation } from "./navigation/platform";

export function PlatformLayout({ children }: { children?: ReactNode }) {
  return <PrivateLayoutFrame navigation={platformNavigation}>{children}</PrivateLayoutFrame>;
}
