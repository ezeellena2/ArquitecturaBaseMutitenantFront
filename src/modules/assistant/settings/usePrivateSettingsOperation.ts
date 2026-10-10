import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import i18n from "@/shared/i18n";
import { toastError } from "@/shared/ui/sonner";
import type { MeResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { AssistantScope } from "../api/assistant";
import { assistantAccess } from "../registration";

/** Sólo este dueño local retiene cuerpos. Query/MutationCache ven exclusivamente un identificador opaco. */
export function usePrivateSettingsOperation<TBody>({ scope, cancellationSignal, queryRoot, allowed, execute, success, failure }: {
  scope: AssistantScope; cancellationSignal: AbortSignal; queryRoot: readonly unknown[]; allowed: (body?: TBody) => boolean;
  execute: (body: TBody, key: string, signal: AbortSignal) => Promise<VersionResponse>;
  success: (body: TBody, response: VersionResponse) => void;
  failure: (error: unknown) => void;
}) {
  const client = useQueryClient();
  const password = useRef<HTMLInputElement>(null);
  const active = useRef(true);
  const operation = useRef<{ handle: string; body: TBody; key?: string; controller: AbortController } | null>(null);
  const [pending, setPending] = useState(false);
  const callbacks = useRef({ allowed, execute, success, failure, queryRoot });
  useLayoutEffect(() => { callbacks.current = { allowed, execute, success, failure, queryRoot }; });
  const eligible = useCallback(() => {
    const me = client.getQueryData<MeResponse>(currentUserQueryKey);
    return active.current && !!me && me.id === scope.userId && me.access === scope.access
      && (me.activeTenantId ?? null) === scope.tenantId && assistantAccess(me, "configure") === "allowed"
      && !cancellationSignal.aborted;
  }, [cancellationSignal, client, scope.access, scope.tenantId, scope.userId]);
  const abandon = useCallback((clearPassword = true) => {
    operation.current?.controller.abort(); operation.current = null;
    if (clearPassword && password.current) password.current.value = "";
    if (active.current) setPending(false);
  }, []);
  useLayoutEffect(() => { active.current = true; return () => { active.current = false; abandon(); }; }, [abandon]);
  useLayoutEffect(() => {
    const cancel = () => abandon();
    if (cancellationSignal.aborted) cancel();
    cancellationSignal.addEventListener("abort", cancel);
    return () => cancellationSignal.removeEventListener("abort", cancel);
  }, [abandon, cancellationSignal]);
  useEffect(() => client.getQueryCache().subscribe((event) => {
    const key = event.query.queryKey;
    const removedOwner = event.type === "removed" && (currentUserQueryKey.every((part, index) => key[index] === part)
      || callbacks.current.queryRoot.every((part, index) => key[index] === part));
    if (removedOwner || !eligible() || !callbacks.current.allowed(operation.current?.body)) abandon();
  }), [abandon, client, eligible]);
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (event.type === "removed" && event.mutation.state.variables === operation.current?.handle) abandon();
    // El evento final incluye agotamiento aun sin observer; los intentos internos no generan avisos.
    if (event.type !== "updated" || event.action.type !== "error" || !operation.current
      || event.mutation.state.variables !== operation.current.handle || !eligible() || !callbacks.current.allowed(operation.current.body)) return;
    const error = event.mutation.state.error;
    if (!(error instanceof ApiError) || error.code !== "Request.InProgress") return;
    setPending(false);
    const mutation = event.mutation; const handle = operation.current.handle;
    toastError(apiErrorMessage(error, i18n.t), { action: { label: i18n.t("actions.retry"), onClick: () => { void mutation.execute(handle).catch(() => undefined); } } });
  }), [abandon, client, eligible]);

  const mutation = useIdempotentMutation<VersionResponse, string>(async (handle, key) => {
    const sent = operation.current;
    const current = () => sent !== null && operation.current === sent && sent.handle === handle && eligible() && callbacks.current.allowed(sent.body);
    if (!current() || !sent) throw new DOMException("", "AbortError");
    sent.key ??= key;
    setPending(true);
    try {
      const response = await callbacks.current.execute(sent.body, sent.key, sent.controller.signal);
      if (!current()) throw new DOMException("", "AbortError");
      callbacks.current.success(sent.body, response);
      abandon();
      return response;
    } catch (error) {
      if (!current()) throw new DOMException("", "AbortError");
      if (error instanceof ApiError && error.code === "Request.InProgress") throw error;
      setPending(false);
      callbacks.current.failure(error);
      if (!(error instanceof ApiError) || (!error.isNetworkError && error.status < 500)) abandon();
      throw error;
    }
  }, { sameOperation: (previous, next) => previous === next });

  function submit(body: TBody) {
    if (!eligible() || (pending && mutation.isPending) || !callbacks.current.allowed(body)) return;
    abandon(false);
    const handle = crypto.randomUUID();
    operation.current = { handle, body: structuredClone(body), controller: new AbortController() };
    if (password.current) password.current.value = "";
    mutation.mutate(handle);
  }
  return { password, pending: pending && mutation.isPending, submit, abandon, eligible };
}
