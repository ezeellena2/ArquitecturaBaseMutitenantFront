import { useIsMutating, useQueryClient, type Mutation, type MutationMeta, type MutationOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { ApiError } from "@/shared/api/ApiError";
import { useMountedRef } from "./useMountedRef";

interface ResourceActionOptions<TVariables> {
  matches?: (meta: MutationMeta | undefined) => boolean;
  isCurrent?: (variables: TVariables) => boolean;
  onError?: (error: ApiError, variables: TVariables) => void;
}

interface NativeCallbacks {
  readonly valid: () => boolean;
  original: MutationOptions<unknown, Error, unknown, unknown>;
  guarded: MutationOptions<unknown, Error, unknown, unknown>;
}
const noMutations = () => false;

/** Observa la operación del recurso aun cuando otro envío haya retirado su observer nativo. */
export function useResourceAction<TVariables extends object>({ matches = noMutations, isCurrent, onError }: ResourceActionOptions<TVariables> = {}) {
  const client = useQueryClient();
  const mounted = useMountedRef();
  // Sólo las variables que entraron por guarded pertenecen a este dueño. No se fuerza el tipo
  // de state.variables (unknown) ni se acepta una operación de otro formulario.
  const variables = useRef(new WeakMap<object, TVariables>());
  const bindings = useRef(new WeakMap<Mutation, NativeCallbacks>());
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
    if (!mounted.current || event.type !== "updated" || event.action.type !== "error" || !matches(event.mutation.meta)) return;
    const raw = event.mutation.state.variables;
    if (typeof raw !== "object" || raw === null) return;
    const sent = variables.current.get(raw);
    const error = event.mutation.state.error;
    if (sent === undefined || (isCurrent && !isCurrent(sent)) || !(error instanceof ApiError)) return;
    onError?.(error, sent);
  }), [client, mounted, matches, isCurrent, onError, protect]);
  const isPending = useIsMutating({ predicate: (mutation) => {
    if (!matches(mutation.meta)) return false;
    if (!isCurrent) return true;
    const raw = mutation.state.variables;
    if (typeof raw !== "object" || raw === null) return false;
    const sent = variables.current.get(raw);
    return sent !== undefined && isCurrent(sent);
  } }) > 0;

  function guarded<TData, TArgs extends unknown[]>(perform: (sent: TVariables, ...args: TArgs) => Promise<TData>, committed?: (response: TData, sent: TVariables) => void) {
    return async (sent: TVariables, ...args: TArgs): Promise<TData> => {
      const current = () => mounted.current && (isCurrent?.(sent) ?? true);
      if (!current()) throw new DOMException("", "AbortError");
      variables.current.set(sent, sent);
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
    variables.current.set(sent, sent);
    protect(mutation);
    return { valid: binding.valid, protect: () => protect(mutation) };
  }
  function run<TData>(sent: TVariables, perform: () => Promise<TData>, committed?: (response: TData, sent: TVariables) => void) {
    return guarded(perform, committed)(sent);
  }
  return { guarded, run, isPending, bindCallbacks, canAct: (sent: TVariables) => mounted.current && (isCurrent?.(sent) ?? true) };
}
