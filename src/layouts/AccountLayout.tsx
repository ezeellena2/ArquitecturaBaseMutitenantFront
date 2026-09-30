import type { ReactNode } from "react";
import { useAccess } from "@/tenancy/useAccess";
import { PersonalLayout } from "./PersonalLayout";
import { BusinessLayout } from "./BusinessLayout";
import { PlatformLayout } from "./PlatformLayout";

export function AccountLayout({ children }: { children: ReactNode }) {
  const { access } = useAccess();
  if (access === "platform") return <PlatformLayout>{children}</PlatformLayout>;
  if (access === "business") return <BusinessLayout>{children}</BusinessLayout>;
  return <PersonalLayout>{children}</PersonalLayout>;
}
