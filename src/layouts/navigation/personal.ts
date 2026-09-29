import { House } from "lucide-react";
import type { NavigationConfig } from "./types";

export const personalNavigation: NavigationConfig = {
  links: [
    { labelKey: "navigation.dashboard", icon: House, to: "/" },
  ],
  administration: null,
};
