import { authIssuer } from "@/auth/issuer";

export type HostSite = { kind: "main" } | { kind: "storefront"; slug: string } | { kind: "unknown" };

const origin = new URL(authIssuer);
export const mainSiteHost = origin.host;
export const publicSiteSuffix = `.${mainSiteHost}`;

// TenantSlug del backend admite una letra, o entre 3 y 63 caracteres ASCII; no admite dos.
function isSlug(value: string): boolean {
  return (value.length === 1 || (value.length >= 3 && value.length <= 63))
    && value === value.trim()
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(value);
}

const isIp = (host: string) => host.includes(":") || /^\d+(?:\.\d+){3}$/.test(host);
const defaultPort = (protocol: string) => protocol === "https:" ? 443 : 80;

/** Clasifica el host completo, con puerto, sin usarlo para elegir el acceso ni el tenant de una sesión. */
export function siteOfHost(host: string, issuer = authIssuer): HostSite {
  const principal = new URL(issuer);
  // No se recorta ni se transforma un host inválido en uno válido: copia SubdomainTests del backend.
  const parsed = /^([a-z0-9.-]+)(?::(\d+))?$/i.exec(host);
  if (!parsed || parsed[0] !== host || isIp(principal.hostname) || !["https:", "http:"].includes(principal.protocol)) return { kind: "unknown" };

  const hostname = parsed[1].toLowerCase();
  const port = parsed[2] === undefined ? defaultPort(principal.protocol) : Number(parsed[2]);
  const principalPort = principal.port === "" ? defaultPort(principal.protocol) : Number(principal.port);
  if (port > 65535 || port !== principalPort || isIp(hostname)) return { kind: "unknown" };
  if (hostname === principal.hostname) return { kind: "main" };

  const suffix = `.${principal.hostname}`;
  if (!hostname.endsWith(suffix)) return { kind: "unknown" };
  const slug = hostname.slice(0, -suffix.length);
  return isSlug(slug) ? { kind: "storefront", slug } : { kind: "unknown" };
}

/** Dirección visible; el vacío conserva el sufijo que acompaña al campo de slug. */
export function publicSiteHost(slug: string): string { return `${slug}${publicSiteSuffix}`; }

/** Enlace al subdominio, con el esquema, el dominio completo y el puerto del issuer. */
export function publicSiteUrl(slug: string, issuer = authIssuer): string {
  if (!isSlug(slug)) throw new RangeError("Invalid public site slug.");
  const principal = new URL(issuer);
  const url = new URL(principal.origin);
  url.hostname = `${slug.toLowerCase()}.${principal.hostname}`;
  return url.href;
}

/** Ruta del dominio principal; nunca permite que un path cambie el origen. */
export function mainSiteUrl(path = "/", issuer = authIssuer): string {
  const principal = new URL(issuer);
  const url = new URL(path, principal.origin);
  if (url.origin !== principal.origin) throw new RangeError("The path must belong to the main site.");
  return url.href;
}
