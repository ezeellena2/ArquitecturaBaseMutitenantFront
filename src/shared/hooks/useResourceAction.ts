import { useQueryClient, type Mutation, type MutationMeta, type MutationOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import { ApiError } from "@/shared/api/ApiError";
import { useMountedRef } from "./useMountedRef";

interface ResourceActionOptions<TVariables> {
  isCurrent?: (variables: TVariables) => boolean;
  onError?: (error: ApiError, variables: TVariables) => void;
  /** Retira cuerpos locales cuando su mutación sale del caché. */
  onRetire?: (variables: TVariables) => void;
}

interface NativeCallbacks {
  readonly valid: () => boolean;
  original: MutationOptions<unknown, Error, unknown, unknown>;
  guarded: MutationOptions<unknown, Error, unknown, unknown>;
}

/** Observa la operación del recurso aun cuando otro envío haya retirado su observer nativo. */
export function useResourceAction<TVariables extends object>({ isCurrent, onError, onRetire }: ResourceActionOptions<TVariables> = {}) {
  const client = useQueryClient();
  const owner = useId();
  const meta = useMemo<MutationMeta>(() => ({ resourceActionOwner: owner }), [owner]);
  const matches = useCallback((candidate: MutationMeta | undefined) => candidate?.resourceActionOwner === owner, [owner]);
  const mounted = useMountedRef();
  // Sólo las variables que entraron por guarded pertenecen a este dueño. No se fuerza el tipo
  // de state.variables (unknown) ni se acepta una operación de otro formulario.
  const variables = useRef(new WeakMap<object, TVariables>());
  const bindings = useRef(new WeakMap<Mutation, NativeCallbacks>());
  const ownershipListeners = useRef(new Set<() => void>());
  function own(sent: TVariables) {
    if (variables.current.has(sent)) return;
    variables.current.set(sent, sent);
    // El estado pending se publica antes de llamar mutationFn. Registrar al dueño también cambia el snapshot.
    ownershipListeners.current.forEach((notify) => notify());
  }
  const protect = useCallback((mutation: Mutation) => {
    const binding = bindings.current.get(mutation);
    if (!binding) return;
    const options = mutation.options;
    if (options.onSuccess === binding.guarded.onSuccess && options.onError === binding.guarded.onError && options.onSettled === binding.guarded.onSettled) return;
    binding.original = { ...options,
      onSuccess: options.onSuccess === binding.guarded.onSuccess ? binding.original.onSuccess : options.onSuccess,
      onError: options.onError === binding.guarded.onError ? binding.original.onError : options.onError,
      onSettled: options.onSettled === binding.guarded.onSettled ? binding.original.onSettled : options.onSettled,
    };
    mutation.setOptions({ ...options, onSuccess: binding.guarded.onSuccess, onError: binding.guarded.onError, onSettled: binding.guarded.onSettled });
  }, []);
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (event.type === "observerOptionsUpdated" && event.mutation && matches(event.mutation.meta)) {
      const mutation = event.mutation;
      queueMicrotask(() => protect(mutation));
    }
    if (mounted.current && event.type === "removed" && matches(event.mutation.meta)) {
      const raw = event.mutation.state.variables;
      if (typeof raw === "object" && raw !== null) {
        const sent = variables.current.get(raw);
        if (sent !== undefined) onRetire?.(sent);
      }
    }
    if (!mounted.current || event.type !== "updated" || event.action.type !== "error" || !matches(event.mutation.meta)) return;
    const raw = event.mutation.state.variables;
    if (typeof raw !== "object" || raw === null) return;
    const sent = variables.current.get(raw);
    const error = event.mutation.state.error;
    if (sent === undefined || (isCurrent && !isCurrent(sent)) || !(error instanceof ApiError)) return;
    onError?.(error, sent);
  }), [client, mounted, matches, isCurrent, onError, onRetire, protect]);
  const isPending = useSyncExternalStore((notify) => {
    const unsubscribe = client.getMutationCache().subscribe(notify);
    ownershipListeners.current.add(notify);
    return () => { unsubscribe(); ownershipListeners.current.delete(notify); };
  }, () => client.getMutationCache().findAll({ status: "pending" }).some((mutation) => {
    if (!matches(mutation.meta)) return false;
    if (!isCurrent) return true;
    const raw = mutation.state.variables;
    if (typeof raw !== "object" || raw === null) return false;
    const sent = variables.current.get(raw);
    return sent !== undefined && isCurrent(sent);
  }));

  function guarded<TData, TArgs extends unknown[]>(perform: (sent: TVariables, ...args: TArgs) => Promise<TData>, committed?: (response: TData, sent: TVariables) => void) {
    return async (sent: TVariables, ...args: TArgs): Promise<TData> => {
      const current = () => mounted.current && (isCurrent?.(sent) ?? true);
      if (!current()) throw new DOMException("", "AbortError");
      own(sent);
      try {
        const response = await perform(sent, ...args);
        if (!current()) throw new DOMException("", "AbortError");
        committed?.(response, sent);
        return response;
      } catch (error) {
        if (!current()) throw new DOMException("", "AbortError");
        throw error;
      }
    };
  }
  /** El primer intento conserva su dueño aunque Observer reemplace luego sus opciones nativas. */
  function bindCallbacks(sent: TVariables, valid: () => boolean) {
    const mutation = client.getMutationCache().find({ predicate: (candidate) => matches(candidate.meta) && candidate.state.variables === sent });
    if (!mutation) return undefined;
    let binding = bindings.current.get(mutation);
    if (!binding) {
      const next: NativeCallbacks = { valid: () => mounted.current && valid(), original: mutation.options, guarded: {} };
      next.guarded = {
        onSuccess: (...args) => next.valid() ? next.original.onSuccess?.(...args) : undefined,
        onError: (...args) => next.valid() ? next.original.onError?.(...args) : undefined,
        onSettled: (...args) => next.valid() ? next.original.onSettled?.(...args) : undefined,
      };
      bindings.current.set(mutation, next); binding = next;
    }
    own(sent);
    protect(mutation);
    return { valid: binding.valid, protect: () => protect(mutation) };
  }
  return { guarded, meta, isPending, bindCallbacks };
}
