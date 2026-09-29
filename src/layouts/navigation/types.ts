import type { LucideIcon } from "lucide-react";

export interface NavigationLink {
  labelKey: string;
  icon: LucideIcon;
  to: string | null;
  permission?: string;
}

export interface NavigationPanel {
  labelKey: string;
  icon: LucideIcon;
  links: readonly NavigationLink[];
}

export interface NavigationConfig {
  links: readonly NavigationLink[];
  administration: NavigationPanel | null;
}
