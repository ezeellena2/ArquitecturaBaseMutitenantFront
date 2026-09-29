import type { ReactNode } from "react";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { businessNavigation } from "./navigation/business";

export function BusinessLayout({ children }: { children?: ReactNode }) {
  return <PrivateLayoutFrame navigation={businessNavigation} scope="business">{children}</PrivateLayoutFrame>;
}
