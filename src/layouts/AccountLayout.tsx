import type { ReactNode } from "react";
import { useAccess } from "@/tenancy/useAccess";
import { BusinessLayout, PersonalLayout, PlatformLayout } from "./lazyLayouts";

export function AccountLayout({ children }: { children: ReactNode }) {
  const { access } = useAccess();
  if (access === "platform") return <PlatformLayout>{children}</PlatformLayout>;
  if (access === "business") return <BusinessLayout>{children}</BusinessLayout>;
  return <PersonalLayout>{children}</PersonalLayout>;
}
