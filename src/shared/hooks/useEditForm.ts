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
  /** La versión que manda el guardado: la de la lectura con la que arrancó o se reinició el formulario. Una relectura de
   * fondo no la cambia; si en el servidor hay una más nueva, el back responde 409. */
  readonly version: VersionOf<TRead>;
  /** Reinicia el formulario con una lectura: lo que se ve y la versión salen de ella. «Ver lo nuevo», con la relectura;
   * «Descartar cambios», con la última lectura. */
  readonly resetTo: (read: NonNullable<TRead>) => void;
  /** Después de una escritura propia que salió bien, con su relectura: el guardado del formulario o lo que se guarda al
   * momento sobre lo mismo (publicar, sumar una empresa). Si la escritura partió de la versión base, la relectura pasa a
   * ser la base y lo que la persona siga editando se conserva; si partió de otra, la base queda y el próximo guardado
   * da 409. */
  readonly wrote: (sentVersion: number, read: TRead | undefined) => void;
}

/// El formulario de una pantalla que edita algo que ya existe, con React Hook Form: arranca con lo guardado y recuerda la
/// lectura de la que partió, para mandar su versión. TanStack Query puede releer la ficha en el fondo (al volver a la
/// pestaña, después de otra escritura) y esa relectura no pisa lo que se está editando ni su versión: si otra persona
/// cambió algo, el guardado da 409 y la persona elige con «Ver lo nuevo» (concurrencia.md). El 409, «Cambios sin
/// guardar» y «¿Salir sin guardar?» los pone `useEditPage`.
export function useEditForm<TRead extends VersionedRead | undefined, TFieldValues extends FieldValues, TTransformedValues = TFieldValues>(
  { read, toValues, ...options }: EditFormOptions<TRead, TFieldValues, TTransformedValues>,
): EditForm<TRead, TFieldValues, TTransformedValues> {
  const form = useForm<TFieldValues, unknown, TTransformedValues>({ ...options, defaultValues: toValues(read) as DefaultValues<TFieldValues> });
  const [version, setVersion] = useState(read?.version ?? undefined);
  // La base también en una ref: `wrote` corre al terminar una escritura y compara con la base de ese momento.
  const base = useRef(read?.version ?? undefined);

  function rebase(next: NonNullable<TRead>, keepEdits: boolean) {
    base.current = next.version ?? undefined;
    setVersion(next.version ?? undefined);
    form.reset(toValues(next), keepEdits ? { keepDirtyValues: true, keepDirty: true, keepErrors: true } : undefined);
  }

  return {
    form,
    version: version as VersionOf<TRead>,
    resetTo: (next) => rebase(next, false),
    wrote: (sentVersion, next) => { if (next && sentVersion === base.current) rebase(next, true); },
  };
}
