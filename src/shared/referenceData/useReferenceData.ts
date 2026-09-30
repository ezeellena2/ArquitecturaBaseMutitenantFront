import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import i18n, { cultureStorageKey, effectiveCulture } from "@/shared/i18n";
import { safeStorageGet } from "@/shared/hooks/safeStorage";
import { fetchReferenceData, type ReferenceData } from "./referenceData";

type ReferenceDataSnapshot = { data: ReferenceData; etag: string | null };

export const referenceDataQueryKey = (culture: string | null) => ["reference-data", culture] as const;

function lastCachedData(client: QueryClient, culture: string | null): ReferenceData | undefined {
  const available = client.getQueriesData<ReferenceDataSnapshot>({ queryKey: ["reference-data"] })
    .flatMap(([, snapshot]) => snapshot ? [snapshot.data] : []);
  return available.find((data) => data.culture === culture) ?? available.at(-1);
}

export function useReferenceData() {
  const [requestedCulture, setRequestedCulture] = useState<string | null>(
    () => safeStorageGet(cultureStorageKey) ?? effectiveCulture(),
  );
  const queryClient = useQueryClient();
  const key = referenceDataQueryKey(requestedCulture);

  useEffect(() => {
    const onLanguageChanged = (culture: string) => {
      const current = queryClient.getQueryData<ReferenceDataSnapshot>(referenceDataQueryKey(requestedCulture))?.data.culture;
      if (culture !== current) setRequestedCulture(culture);
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => { i18n.off("languageChanged", onLanguageChanged); };
  }, [queryClient, requestedCulture]);

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ReferenceDataSnapshot> => {
      const previous = queryClient.getQueryData<ReferenceDataSnapshot>(key);
      const response = await fetchReferenceData(requestedCulture, previous?.etag ?? null);
      if (response.notModified) {
        if (!previous) throw new Error("El catálogo respondió 304 sin una copia local");
        return previous;
      }
      if (!response.data) throw new Error("La API no devolvió datos de referencia");
      return { data: response.data, etag: response.etag };
    },
    select: (snapshot) => snapshot.data,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
  return { ...query, data: query.data ?? lastCachedData(queryClient, requestedCulture) };
}
