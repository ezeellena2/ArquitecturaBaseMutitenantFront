import type { ReactNode } from "react";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { personalNavigation } from "./navigation/personal";

export function PersonalLayout({ children }: { children?: ReactNode }) {
  return <PrivateLayoutFrame navigation={personalNavigation}>{children}</PrivateLayoutFrame>;
}
