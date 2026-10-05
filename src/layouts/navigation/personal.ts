import { HomeIcon, UserIcon } from "@/shared/ui/icons";
import type { NavigationConfig } from "./types";

export const personalNavigation: NavigationConfig = {
  links: [
    { path: "/", labelKey: "navigation.dashboard", icon: HomeIcon },
    { path: "/cuenta", labelKey: "accessMenu.myAccount", icon: UserIcon },
  ],
  administration: null,
  moreTo: "/mas",
};
