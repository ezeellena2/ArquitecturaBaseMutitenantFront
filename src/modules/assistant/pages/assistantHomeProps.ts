import type { ReactNode } from "react";
import type { AssistantRouteKey } from "../api/types";
import type { AssistantScope } from "../api/assistant";

export interface AssistantHomeProps {
  scope: AssistantScope;
  enabled: boolean;
  /** El núcleo compone bienvenida, indicadores y Para resolver. */
  welcome?: ReactNode;
  /** Avisos del núcleo que siguen visibles con una conversación abierta. */
  banner?: ReactNode;
  children?: ReactNode;
  hasPermission: (permission: string) => boolean;
  canOpenLink?: (routeKey: AssistantRouteKey) => boolean;
  onConfigure?: () => void;
  onUsage?: () => void;
  onPrivacy: () => void;
  onUnavailable?: () => void;
  organizationName?: string;
  organizationIds?: readonly string[];
  organizationNames?: Readonly<Record<string, string>>;
  onOpenOrganization?: (id: string) => void;
}

