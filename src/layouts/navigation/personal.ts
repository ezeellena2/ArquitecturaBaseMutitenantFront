import { House, UserRound } from "lucide-react";
import type { NavigationConfig } from "./types";

export const personalNavigation: NavigationConfig = {
  links: [
    { path: "/", labelKey: "navigation.dashboard", icon: House },
    { path: "/cuenta", labelKey: "accessMenu.myAccount", icon: UserRound },
  ],
  administration: null,
  moreTo: "/mas",
};
