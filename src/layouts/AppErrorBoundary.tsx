import { Component, type ReactNode } from "react";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";

function reloadPage(): void {
  window.location.reload();
}

/// Una pantalla que se rompió al pintarse o que no se pudo bajar: la misma «Pantalla de error» que una ficha que no
/// cargó («Criterio · Avisos»), y «Reintentar» vuelve a cargar la página.
export function AppErrorPage({ onReload = reloadPage }: { onReload?: () => void }) {
  return <main className="flex min-h-full flex-1 flex-col"><LoadErrorPage onRetry={onReload} /></main>;
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  onReload: () => void;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? <AppErrorPage onReload={this.props.onReload} />
      : this.props.children;
  }
}
