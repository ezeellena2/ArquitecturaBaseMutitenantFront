import type { TFunction } from "i18next";
import type { HomeCompanyCard } from "@/shared/api/types";
import type { FormatState } from "@/shared/format/useFormat";
import { countOf } from "@/shared/format/countOf";

/** Lo que dice una empresa de «Tus empresas» debajo del nombre: sus roles y, si la API lo da, cuántos miembros tiene. */
export function companyDetail(company: HomeCompanyCard, t: TFunction, format: FormatState): string {
  const roles = company.roles.join(", ");
  return company.memberCount == null ? roles : `${roles} · ${t("home:members", countOf(format, company.memberCount))}`;
}
