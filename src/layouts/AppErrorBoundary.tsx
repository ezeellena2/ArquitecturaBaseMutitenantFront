import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

function reloadPage(): void {
  window.location.reload();
}

export function AppErrorPage({ onReload = reloadPage }: { onReload?: () => void }) {
  const { t } = useTranslation("errors");
  return <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
    <h1 className="text-xl font-semibold">{t("loadFailed")}</h1>
    <Button type="button" onClick={onReload}>{t("update")}</Button>
  </main>;
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
