import { House, UserRound } from "lucide-react";
import type { NavigationConfig } from "./types";

export const personalNavigation: NavigationConfig = {
  links: [
    { labelKey: "navigation.dashboard", icon: House, to: "/" },
    { labelKey: "accessMenu.myAccount", icon: UserRound, to: "/cuenta" },
  ],
  administration: null,
};
