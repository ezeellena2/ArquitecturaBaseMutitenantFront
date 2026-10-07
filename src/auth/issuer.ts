/** El dominio principal es la única autoridad OIDC y la raíz de las direcciones públicas. */
export const authIssuer = new URL(import.meta.env.VITE_AUTH_ISSUER ?? "https://localtest.me:5174/").href;
