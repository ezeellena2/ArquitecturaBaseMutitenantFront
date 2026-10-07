import { useCurrentUser } from "@/auth/useCurrentUser";
import { defaultCompanyTaxIdType } from "./companyTaxIdType";
import { useReferenceData } from "./useReferenceData";

/** El país de la organización llega en /api/me, también sin permiso para leer Configuración. */
export function useCompanyTaxIdType() {
  const { data: account } = useCurrentUser();
  const { data } = useReferenceData();
  return { types: data?.taxIdTypes ?? [], defaultType: defaultCompanyTaxIdType(data?.taxIdTypes ?? [], account?.organizationCountryCode) };
}
