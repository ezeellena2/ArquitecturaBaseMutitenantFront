import { useTranslation } from "react-i18next";
import { useRef } from "react";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { Button } from "./button";
import { FormError } from "./FormError";
import { Input } from "./input";
import { LoadMore } from "./LoadMore";

export function RemoteOptionSearch({ remote, label }: { remote: RemoteOptions; label?: string }) {
  const { t } = useTranslation();
  return <div className="p-2"><Input type="search" autoFocus aria-label={label ?? t("actions.search")} placeholder={label ?? t("actions.search")}
    value={remote.search} onChange={(event) => remote.onSearch(event.target.value)}
    onKeyDown={(event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.currentTarget.closest('[data-slot="dropdown-menu-content"]')?.querySelector<HTMLElement>('[role="menuitemcheckbox"], [role="menuitemradio"]')?.focus();
      }
      if (event.key !== "Escape") event.stopPropagation();
    }} /></div>;
}

export function RemoteOptionFooter({ remote }: { remote: RemoteOptions }) {
  const { t } = useTranslation();
  const root = useRef<HTMLDivElement>(null);
  function act(action: () => void) {
    // El botón puede desaparecer al terminar la última página o el reintento: el foco queda dentro del selector.
    root.current?.parentElement?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    action();
  }
  return <div ref={root}>
    {remote.loading ? <p role="status" className="px-3 py-2 text-[13px] text-[var(--t2)]">{t("states.loading")}</p> : null}
    {remote.error ? <div className="p-2"><FormError message={apiErrorMessage(remote.error, t)} /><Button type="button" variant="outline" onClick={() => act(remote.onRetry)}>{t("actions.retry")}</Button></div> : null}
    <LoadMore hasMore={remote.hasMore} isLoading={remote.loading} onLoadMore={() => act(remote.onLoadMore)} />
  </div>;
}
