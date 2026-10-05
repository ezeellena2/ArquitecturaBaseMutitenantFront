import { useRef, useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";

/// Una lectura de algo que se edita: trae la versión con la que se guarda (concurrencia optimista). En algunos contratos
/// generados es opcional, como en `MeResponse`.
export interface VersionedRead {
  readonly version?: number | null;
}

/// Con una lectura que siempre trae versión, hay versión; sin lectura (un alta), o si el contrato la marca opcional, puede
/// no haberla.
type VersionOf<TRead> = TRead extends { readonly version: number } ? number : number | undefined;

export type EditFormOptions<TRead extends VersionedRead | undefined, TFieldValues extends FieldValues, TTransformedValues> =
  Omit<UseFormProps<TFieldValues, unknown, TTransformedValues>, "defaultValues" | "values"> & {
    /** La lectura con la que arranca el formulario: lo guardado. Un alta no tiene lectura. */
    readonly read: TRead;
    /** Lo que muestra el formulario para una lectura (en un alta, sin lectura, lo de empezar). */
    readonly toValues: (read: TRead) => TFieldValues;
  };

export interface EditForm<TRead extends VersionedRead | undefined, TFieldValues extends FieldValues, TTransformedValues> {
  readonly form: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  /** La versión que manda el guardado: la de la lectura con la que arrancó o se reinició el formulario o, después de
   * guardar, la que respondió el guardado. Una relectura no la cambia; si en el servidor hay una más nueva, el back
   * responde 409. */
  readonly version: VersionOf<TRead>;
  /** Reinicia el formulario con una lectura: lo que se ve y la versión salen de ella. «Ver lo nuevo», con la relectura;
   * «Descartar cambios», con la última lectura. */
  readonly resetTo: (read: NonNullable<TRead>) => void;
  /** Después de una escritura propia que salió bien: el guardado del formulario o lo que se guarda al momento sobre lo
   * mismo (publicar, sumar una empresa), con la versión que mandó, la que respondió (`VersionResponse`) y su relectura.
   * Si partió de la base, la base pasa a ser la versión que respondió; si la relectura trae esa misma versión, sus
   * valores son lo guardado y lo que la persona siga editando se conserva. Una relectura con otra versión trae el cambio
   * de otra persona: no pisa nada y el próximo guardado da 409, con «Ver lo nuevo». Si la escritura partió de otra
   * versión, la base queda y el próximo guardado también da 409. */
  readonly wrote: (sentVersion: number, savedVersion: number, read: TRead | undefined) => void;
}

/// El formulario de una pantalla que edita algo que ya existe, con React Hook Form: arranca con lo guardado y recuerda la
/// lectura de la que partió, para mandar su versión; después de guardar, manda la que respondió el guardado. TanStack
/// Query puede releer la ficha en el fondo (al volver a la pestaña, después de otra escritura) y esa relectura no pisa lo
/// que se está editando ni su versión: si otra persona cambió algo, el guardado da 409 y la persona elige con «Ver lo
/// nuevo» (concurrencia.md). El 409, «Cambios sin
/// guardar» y «¿Salir sin guardar?» los pone `useEditPage`.
export function useEditForm<TRead extends VersionedRead | undefined, TFieldValues extends FieldValues, TTransformedValues = TFieldValues>(
  { read, toValues, ...options }: EditFormOptions<TRead, TFieldValues, TTransformedValues>,
): EditForm<TRead, TFieldValues, TTransformedValues> {
  const form = useForm<TFieldValues, unknown, TTransformedValues>({ ...options, defaultValues: toValues(read) as DefaultValues<TFieldValues> });
  const [version, setVersion] = useState(read?.version ?? undefined);
  // La base también en una ref: `wrote` corre al terminar una escritura y compara con la base de ese momento.
  const base = useRef(read?.version ?? undefined);

  function setBase(next: number | undefined) {
    base.current = next;
    setVersion(next);
  }

  return {
    form,
    version: version as VersionOf<TRead>,
    resetTo: (next) => {
      setBase(next.version ?? undefined);
      form.reset(toValues(next));
    },
    wrote: (sentVersion, savedVersion, next) => {
      if (sentVersion !== base.current) return;
      setBase(savedVersion);
      if (next && next.version === savedVersion) form.reset(toValues(next), { keepDirtyValues: true, keepDirty: true, keepErrors: true });
    },
  };
}
