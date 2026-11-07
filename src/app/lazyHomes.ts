import { lazy } from "react";

// Los Inicios privados se montan dentro de su guarda: se bajan recién cuando la sesión los muestra, nunca en la portada.
export const PersonalHomePage = lazy(() => import("@/areas/personal/home/pages/PersonalHomePage").then((module) => ({ default: module.PersonalHomePage })));
export const BusinessHomePage = lazy(() => import("@/areas/business/home/pages/BusinessHomePage").then((module) => ({ default: module.BusinessHomePage })));
export const PlatformHomePage = lazy(() => import("@/areas/platform/home/pages/PlatformHomePage").then((module) => ({ default: module.PlatformHomePage })));
