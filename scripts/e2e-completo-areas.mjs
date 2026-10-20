const keyOf = (value) => value.normalize("NFKD").replace(/\p{M}/gu, "").trim().replace(/\s+/gu, " ").toLowerCase();
const names = {
  Identidad: ["identity", "entra", "Complemento de identidad", "Sesión histórica", "Políticas de registro", "Recuperación"],
  Personal: ["persona", "personal/account", "Mi cuenta"],
  Organizaciones: ["business", "business/onboarding", "business/members-and-roles", "business/administration", "equipo", "empresa", "administra", "Administración complementaria", "Administración y aislamiento", "Organizaciones · complemento", "Empresas", "Roles", "Roles y permisos de empresa", "Configuración", "Auditoría de organización", "Inicio", "Dominio y métodos administrados"],
  Plataforma: ["platform", "Complemento de Plataforma", "Configuración de Plataforma"],
  Asistente: ["assistant", "Asistente · complemento", "Asistente: comprobaciones originales sin callback"],
  WhatsApp: ["WhatsApp de atención", "WhatsApp de Plataforma", "WhatsApp · complemento E11", "WhatsApp · cuota diaria real", "WhatsApp e identidad"],
  "Sitio público": ["public", "llega", "Sitio público y Configuración"],
  Legales: ["legal"],
  "Contrato HTTP": [],
  "Comunicaciones del sistema": ["system-delivery", "manda"],
  Seguridad: ["security", "Complemento de seguridad"],
  Transversal: ["Asistente y WhatsApp", "Identidad y sitio público", "Público y Personal", "Cierre de cobertura local", "Continuación del recorrido existente", "Fase original del recorrido"],
};
const aliases = new Map(Object.entries(names).flatMap(([canonical, values]) => [canonical, ...values].map((value) => [keyOf(value), canonical])));

/** Sólo cambia metadatos de presentación; conserva orden, resultados y enlaces por referencia. */
export function normalizeCaseAreas(rows = []) {
  return rows.map((item) => {
    const canonical = typeof item.area === "string" ? aliases.get(keyOf(item.area)) : undefined;
    if (!canonical || item.area === canonical && Object.hasOwn(item, "areaOriginal")) return item;
    return { ...item, area: canonical, areaOriginal: Object.hasOwn(item, "areaOriginal") ? item.areaOriginal : item.area };
  });
}
