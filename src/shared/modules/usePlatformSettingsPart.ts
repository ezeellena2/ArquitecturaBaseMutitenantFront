import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { PlatformSettingsPartHandle, PlatformSettingsPartProps } from "./types";

/** El formulario de la parte, con su versión: lo que da `useEditForm` sobre una lectura que siempre la trae. */
export interface PlatformSettingsPartForm<TRead, TValues extends FieldValues, TTransformed> {
  readonly form: UseFormReturn<TValues, unknown, TTransformed>;
  readonly version: number;
  readonly resetTo: (read: TRead) => void;
  readonly wrote: (sentVersion: number, savedVersion: number, read: TRead | undefined) => void;
}

export interface PlatformSettingsPartOptions<TRead, TValues extends FieldValues, TTransformed> {
  /** Lo que la página le dio a la parte para anotarse. */
  readonly register: PlatformSettingsPartProps["register"];
  readonly edit: PlatformSettingsPartForm<TRead, TValues, TTransformed>;
  /** La última lectura: «Descartar cambios» vuelve a ella. */
  readonly settings: TRead;
  /** «Ver lo nuevo»: relee lo guardado. */
  readonly reload: () => Promise<TRead | undefined>;
  /** La lectura de la parte: se relee después de guardar y de ella sale la versión que queda. */
  readonly queryKey: QueryKey;
  /** Las otras consultas que muestran lo que se guarda (el estado del Inicio): se invalidan también (lista de control 15). */
  readonly shownIn?: readonly QueryKey[];
  /** Los campos del 400 del back que caen en el formulario; con otro, el error sube a la página. */
  readonly serverFields: Readonly<Record<string, FieldPath<TValues>>>;
  /** Manda lo suyo con la versión con que arrancó. */
  readonly send: (values: TValues, version: number) => Promise<{ readonly version: number }>;
  /** Lo que la parte vuelve a cero, además del formulario, al guardar, descartar o releer (el aviso de costo de un país). */
  readonly onReset?: () => void;
}

/**
 * Hace de un formulario una parte de Plataforma › Configuración (`PlatformSettingsPartHandle`): la anota cada vez que
 * cambia si tiene cambios sin guardar y la borra al desmontarse. «Guardar cambios» de la página la valida y la guarda
 * con su versión: un 400 en sus campos queda en ellos y devuelve `false`; un 409 u otra falla se tira, y la muestra la
 * página. Toda parte se guarda con esta misma mecánica.
 */
export function usePlatformSettingsPart<TRead, TValues extends FieldValues, TTransformed>(
  options: PlatformSettingsPartOptions<TRead, TValues, TTransformed>,
): void {
  const client = useQueryClient();
  const { register, edit: { form } } = options;
  const isDirty = form.formState.isDirty;
  // La página llama siempre a lo último que dibujó la parte, sin volver a anotarla en cada dibujo.
  const latest = useRef<Omit<PlatformSettingsPartHandle, "isDirty"> | null>(null);
  useLayoutEffect(() => {
    const { edit: { version, resetTo, wrote }, settings, reload, queryKey, shownIn = [], serverFields, send, onReset } = options;
    latest.current = {
      validate: () => form.trigger(),
      save: async () => {
        const values = form.getValues(); const sentVersion = version;
        try {
          const result = await send(values, sentVersion);
          form.reset(values); onReset?.();
          for (const key of shownIn) void client.invalidateQueries({ queryKey: key });
          await client.invalidateQueries({ queryKey });
          wrote(sentVersion, result.version, client.getQueryData<TRead>(queryKey));
          return true;
        } catch (error) {
          if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields)) return false;
          throw error;
        }
      },
      discard: () => { resetTo(settings); onReset?.(); },
      reload: async () => { const fresh = await reload(); if (fresh) resetTo(fresh); onReset?.(); },
    };
  });
  useEffect(() => {
    register({ isDirty, validate: () => latest.current!.validate(), save: () => latest.current!.save(), discard: () => latest.current!.discard(), reload: () => latest.current!.reload() });
  }, [isDirty, register]);
  useEffect(() => () => register(null), [register]);
}
