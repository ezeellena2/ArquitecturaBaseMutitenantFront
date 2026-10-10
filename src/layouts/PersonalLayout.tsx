import type { ReactNode } from "react";
import { PrivateLayoutFrame } from "./PrivateLayoutFrame";
import { useNavigation } from "./navigation/useNavigation";

export function PersonalLayout({ children }: { children?: ReactNode }) {
  const navigation = useNavigation("consumer");
  return <PrivateLayoutFrame navigation={navigation} scope="personal">{children}</PrivateLayoutFrame>;
}
