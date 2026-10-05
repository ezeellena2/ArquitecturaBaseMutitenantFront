import type { TFunction } from "i18next";
import type { HomeCompanyCard } from "@/shared/api/types";

/** Lo que dice una empresa de «Tus empresas» debajo del nombre: sus roles y, si la API lo da, cuántos miembros tiene. */
export function companyDetail(company: HomeCompanyCard, t: TFunction): string {
  const roles = company.roles.join(", ");
  return company.memberCount == null ? roles : `${roles} · ${t("home:members", { count: company.memberCount })}`;
}
