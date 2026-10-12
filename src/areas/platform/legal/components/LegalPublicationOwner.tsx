import type { MutationMeta } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PublishedLegalDocumentResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { samePublication, type LegalPublicationOperation } from "../lib/legalPublication";

// Se remonta por borrador/elección: el Retry antiguo pertenece a un dueño abortado y no rota la clave del nuevo.
// RHF queda afuera: conserva texto, errores y foco al abandonar una confirmación o corregir el cuerpo.
export function LegalPublicationOwner({ operation, meta, execute }: {
  operation: LegalPublicationOperation;
  meta: MutationMeta;
  execute: (operation: LegalPublicationOperation, key: string) => Promise<PublishedLegalDocumentResponse>;
}) {
  const { mutate } = useIdempotentMutation(execute, { meta, sameOperation: samePublication });
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) mutate(operation); });
    return () => { mounted = false; };
  }, [mutate, operation]);
  return null;
}
