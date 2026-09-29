import { House, ShieldCheck } from "lucide-react";
import type { NavigationConfig } from "./types";

export const businessNavigation: NavigationConfig = {
  links: [{ labelKey: "navigation.dashboard", icon: House, to: "/org" }],
  administration: { labelKey: "navigation.administration", icon: ShieldCheck, links: [] },
};
