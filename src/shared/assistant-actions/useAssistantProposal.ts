import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "@/shared/api/ApiError";
import { retryWhileInProgress } from "@/shared/api/useIdempotentMutation";
import { assistantActions, type AssistantActionContract, type AssistantActionKey } from "@/shared/api/generated/assistant-actions";
import type { AssistantProposalResponse } from "@/shared/api/types";
import { assistantProposalQueryKey, markAssistantProposalApplied, readAssistantProposal, requestAssistantProposalAttempt } from "./api";
import {
  applyAssistantProposal, assistantProposalChanges, assistantProposalDoubts, decodeAssistantProposal, doubtKey, emptyAssistantProposalValues,
  type AssistantProposalChanges, type AssistantProposalValues,
} from "./operations";
import { assistantActionKey, assistantProposalParam } from "./registry";

const keyReusedCode = "Request.IdempotencyKeyReused";
const alreadyAppliedCode = "Assistant.Proposal.AlreadyApplied";

/** «Ya se guardó»: el 409 de `attempts` cuando una clave de la propuesta ya terminó en 2xx, con el enlace a lo creado. */
export function assistantProposalAlreadySaved(error: unknown): { readonly location: string | null } | undefined {
  if (!(error instanceof ApiError) || error.code !== alreadyAppliedCode) return undefined;
  const location = error.problem.location;
  return { location: typeof location === "string" && location !== "" ? location : null };
}

/** La propuesta leída del servidor, con el estado y los nombres de ese momento. La tarjeta del hilo usa la misma. */
export function useAssistantProposalQuery(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: assistantProposalQueryKey(proposalId ?? ""),
    queryFn: ({ signal }) => readAssistantProposal(proposalId!, signal),
    enabled: Boolean(proposalId),
    // El estado se calcula en cada lectura (los permisos de ahora): abrir la pantalla vuelve a preguntar.
    staleTime: 0,
  });
}

interface WithProposal {
  readonly proposalId: string;
  readonly proposal: AssistantProposalResponse;
}

export type AssistantProposal<TForm> =
  /** Sin `?proposal`, o la propuesta es de otra acción: la pantalla de siempre. */
  | { readonly status: "none" }
  | { readonly status: "loading"; readonly proposalId: string }
  /** No se abre: un valor no se puede mostrar o no se pudo leer. La pantalla sigue como siempre. */
  | { readonly status: "rejected"; readonly proposalId: string; readonly proposal?: AssistantProposalResponse }
  /** Reemplazada, ya no disponible o sin confirmar: no se abre (lo dice la tarjeta). */
  | (WithProposal & { readonly status: "unavailable" })
  /** Ya se guardó, en otra pestaña o recién: `proposal.appliedLocation` lleva a lo hecho. */
  | (WithProposal & { readonly status: "applied" })
  /** Editar espera lo que la pantalla lee al abrir (`current`); con la propuesta ya sabe qué leer. */
  | (WithProposal & { readonly status: "waiting" })
  | (WithProposal & {
    readonly status: "ready";
    readonly action: AssistantActionContract;
    /** Lo propuesto ya aplicado sobre lo leído, con la forma del formulario de la pantalla. */
    readonly formValues: TForm;
    /** «Lo que cambia», también lo que se quita y las filas de un `Items`. */
    readonly changes: AssistantProposalChanges;
    /** La clave de texto de la duda («Revisá») de un campo, o de un elemento de una lista o una fila. */
    readonly doubtOf: (field: string, item?: string) => string | undefined;
    /**
     * Crear: guarda con la clave que da la propuesta (`attempts`), y espera si otra pestaña está guardando con la misma
     * (`Request.InProgress`). Ante un 422 de clave repetida vuelve a preguntar: si
     * una clave ya terminó en 2xx, falla con el 409 «Ya se guardó» (`assistantProposalAlreadySaved`); si da otra, es
     * otro intento. Después del 2xx avisa `applied`.
     */
    readonly send: <T>(save: (idempotencyKey: string) => Promise<T>) => Promise<T>;
    /** Editar o quitar: después del 2xx de la ruta de siempre, con la versión nueva al editar. */
    readonly markApplied: (version?: number) => Promise<void>;
  });

/**
 * Abre la propuesta de `?proposal=<id>` en la pantalla de su acción (ADR 0068 §9). `toFormValues` (estable, fuera del
 * componente) pasa lo propuesto al formulario y devuelve `undefined` si algo no entra: entonces la pantalla no abre la
 * propuesta. Al editar, `current` es lo que la pantalla leyó al abrir, memorizado, con los nombres que muestra.
 */
export function useAssistantProposal<TForm>(
  action: AssistantActionKey,
  toFormValues: (values: AssistantProposalValues) => TForm | undefined,
  current?: AssistantProposalValues,
): AssistantProposal<TForm> {
  const [params] = useSearchParams();
  const proposalId = params.get(assistantProposalParam);
  const query = useAssistantProposalQuery(proposalId);
  const client = useQueryClient();
  const contract = assistantActions.find((candidate) => assistantActionKey(candidate.id, candidate.version) === action);
  const data = query.data;
  const matches = data !== undefined && data.kind === "action" && assistantActionKey(data.action, data.version) === action;

  const prepared = useMemo(() => {
    if (!data || !matches || !contract || data.state !== "new") return undefined;
    const operations = decodeAssistantProposal(contract, data.values);
    if (!operations) return "rejected" as const;
    const base = contract.kind === "edit" ? current : emptyAssistantProposalValues;
    if (!base) return "waiting" as const;
    const next = applyAssistantProposal(contract, base, operations);
    const formValues = next && toFormValues(next);
    if (!next || formValues === undefined) return "rejected" as const;
    const doubts = assistantProposalDoubts(operations);
    return { formValues, changes: assistantProposalChanges(contract, base, next), doubtOf: (field: string, item?: string) => doubts.get(doubtKey(field, item)) };
  }, [data, matches, contract, current, toFormValues]);

  const markApplied = useCallback(async (version?: number) => {
    if (!proposalId) return;
    const queryKey = assistantProposalQueryKey(proposalId);
    try {
      client.setQueryData(queryKey, await markAssistantProposalApplied(proposalId, version));
    } catch {
      // Lo guardado ya quedó: la tarjeta se entera en la próxima lectura (el servidor lo comprueba con la clave o la versión).
      await client.invalidateQueries({ queryKey });
    }
  }, [client, proposalId]);

  // Como useIdempotentMutation: cerrar la pantalla corta la espera de un Request.InProgress.
  const lifetimeRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;
    return () => lifetime.abort();
  }, []);

  const send = useCallback(async <T,>(save: (idempotencyKey: string) => Promise<T>): Promise<T> => {
    if (!proposalId || contract?.kind !== "create") throw new Error("La clave de la propuesta es solo para crear.");
    const signal = lifetimeRef.current?.signal;
    if (!signal) throw new DOMException("", "AbortError");
    let reused: { readonly key: string; readonly error: ApiError } | undefined;
    for (;;) {
      let key: string;
      try {
        key = (await requestAssistantProposalAttempt(proposalId)).idempotencyKey;
      } catch (error) {
        if (assistantProposalAlreadySaved(error)) await client.invalidateQueries({ queryKey: assistantProposalQueryKey(proposalId) });
        throw error;
      }
      // La misma clave después de un 422 no es otro intento: se muestra el 422 de siempre.
      if (reused?.key === key) throw reused.error;
      try {
        // Dos pestañas usan la misma clave: mientras la otra guarda, se espera como en useIdempotentMutation.
        const result = await retryWhileInProgress(() => save(key), signal);
        await markApplied();
        return result;
      } catch (error) {
        // El 422 no prueba que se guardó (la clave guarda también un 4xx): se le vuelve a preguntar a la propuesta, una vez.
        if (!reused && error instanceof ApiError && error.status === 422 && error.code === keyReusedCode) {
          reused = { key, error };
          continue;
        }
        throw error;
      }
    }
  }, [client, contract, markApplied, proposalId]);

  if (!proposalId) return { status: "none" };
  if (query.isPending) return { status: "loading", proposalId };
  if (!data) return { status: "rejected", proposalId };
  if (!matches) return { status: "none" };
  if (data.state === "applied") return { status: "applied", proposalId, proposal: data };
  if (data.state !== "new") return { status: "unavailable", proposalId, proposal: data };
  if (!contract || prepared === "rejected") return { status: "rejected", proposalId, proposal: data };
  if (prepared === undefined || prepared === "waiting") return { status: "waiting", proposalId, proposal: data };
  return { status: "ready", proposalId, proposal: data, action: contract, ...prepared, send, markApplied };
}
