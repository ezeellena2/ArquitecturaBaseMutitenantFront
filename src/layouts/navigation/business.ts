import { House, Settings2 } from "lucide-react";
import type { NavigationConfig } from "./types";

export const businessNavigation: NavigationConfig = {
  links: [{ labelKey: "navigation.dashboard", icon: House, to: "/org" }],
  administration: {
    labelKey: "navigation.administration",
    icon: Settings2,
    links: [],
    sections: [{
      labelKey: "navigation.userManagement",
      links: [{ labelKey: "navigation.roles", icon: House, to: "/org/roles", permission: "roles.read" }],
    }],
  },
};
