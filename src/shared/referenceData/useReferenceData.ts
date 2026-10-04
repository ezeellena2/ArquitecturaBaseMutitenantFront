import { keepPreviousData, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { chosenCulture, useEffectiveCulture } from "@/shared/i18n";
import { fetchReferenceData, type ReferenceData } from "./referenceData";

type ReferenceDataSnapshot = { data: ReferenceData; etag: string | null };

export const referenceDataQueryKey = (culture: string | null) => ["reference-data", culture] as const;

function lastCachedData(client: QueryClient, culture: string | null): ReferenceData | undefined {
  const available = client.getQueriesData<ReferenceDataSnapshot>({ queryKey: ["reference-data"] })
    .flatMap(([, snapshot]) => snapshot ? [snapshot.data] : []);
  return available.find((data) => data.culture === culture) ?? available.at(-1);
}

/// El catálogo en la cultura efectiva. Antes de que llegue el primero (todavía no hay cultura efectiva), se pide en la
/// que la persona eligió en este navegador o, sin elección, en la predeterminada del back. El catálogo queda guardado
/// también bajo la cultura en que vino: cuando i18n aplica esa misma cultura, no se vuelve a pedir.
export function useReferenceData() {
  const culture = useEffectiveCulture() ?? chosenCulture();
  const queryClient = useQueryClient();
  const key = referenceDataQueryKey(culture);

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ReferenceDataSnapshot> => {
      const previous = queryClient.getQueryData<ReferenceDataSnapshot>(key);
      const response = await fetchReferenceData(culture, previous?.etag ?? null);
      if (response.notModified) {
        if (!previous) throw new Error("El catálogo respondió 304 sin una copia local");
        return previous;
      }
      if (!response.data) throw new Error("La API no devolvió datos de referencia");
      const snapshot = { data: response.data, etag: response.etag };
      if (response.data.culture !== culture) queryClient.setQueryData(referenceDataQueryKey(response.data.culture), snapshot);
      return snapshot;
    },
    select: (snapshot) => snapshot.data,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
  return { ...query, data: query.data ?? lastCachedData(queryClient, culture) };
}
