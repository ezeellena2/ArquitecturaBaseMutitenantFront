// La dirección visible actual de la página pública. E7 la completa desde el issuer.
export const publicSiteSuffix = ".plataforma.com";

export function publicSiteHost(slug: string): string { return `${slug}${publicSiteSuffix}`; }
