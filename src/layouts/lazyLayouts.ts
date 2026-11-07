import { lazy } from "react";

// Los marcos privados se bajan recién cuando se muestran: la portada, el directorio, el ingreso y el subdominio no los
// usan y no deben cargarlos al abrir (docs/rules/estructura-y-features.md, «Peso inicial»). Mientras llega el archivo, la
// suspensión la resuelve el Suspense de AppProviders, igual que una pantalla con lazyPage.
export const BusinessLayout = lazy(() => import("./BusinessLayout").then((module) => ({ default: module.BusinessLayout })));
export const PersonalLayout = lazy(() => import("./PersonalLayout").then((module) => ({ default: module.PersonalLayout })));
export const PlatformLayout = lazy(() => import("./PlatformLayout").then((module) => ({ default: module.PlatformLayout })));
