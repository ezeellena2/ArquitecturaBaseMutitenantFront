import { moduleComposition } from "@/app/moduleComposition";
import i18n, { type Resource } from "i18next";
import { useSyncExternalStore } from "react";
import { initReactI18next } from "react-i18next";
import { safeStorageGet, safeStorageSet } from "@/shared/hooks/safeStorage";

export type CultureLocale = {
  code: string;
  languageCode: string;
  fallbackCulture: string | null;
  isEnabled: boolean;
  isDefault: boolean;
};

export const cultureStorageKey = "arquitecturabasemt.culture";

/// La cultura efectiva, una sola para los textos, los formatos, el catálogo y Accept-Language (frontend.md, «Idioma y
/// cultura»): la de la cuenta; si no, la que la persona eligió en este navegador; si no, la predeterminada del
/// catálogo. Solo vale una cultura habilitada.
export function resolveCulture({ account, chosen, cultures }: {
  account?: string | null;
  chosen?: string | null;
  cultures: readonly Pick<CultureLocale, "code" | "isEnabled" | "isDefault">[];
}): string {
  const enabled = cultures.filter((culture) => culture.isEnabled);
  const usable = (code: string | null | undefined) => enabled.find((culture) => culture.code === code)?.code;
  const fallback = enabled.find((culture) => culture.isDefault)?.code;
  if (!fallback) throw new Error("Cultures debe tener una cultura predeterminada habilitada");
  return usable(account) ?? usable(chosen) ?? fallback;
}

/// La cultura que la persona eligió en este navegador; con el almacenamiento bloqueado, la de esta sesión.
export function chosenCulture(): string | null {
  return safeStorageGet(cultureStorageKey);
}

// Los archivos de interfaz son la fuente de idiomas disponibles. Las culturas y su fallback
// llegan por Cultures desde shared/referenceData; ninguna lista de culturas vive acá.
// Solo el idioma de arranque (el `lang` de index.html) viaja en la carga inicial; los demás se bajan en
// configureI18n, cuando el catálogo dice qué culturas están habilitadas.
const initialLanguage = "es";
const initialFiles = import.meta.glob<Record<string, unknown>>("../../locales/es/*.json", {
  import: "default", eager: true,
});
const laterFiles = import.meta.glob<Record<string, unknown>>(["../../locales/*/*.json", "!../../locales/es/*.json"], {
  import: "default",
});
const localeFileOf = (path: string) => /\/([^/]+)\/([^/]+)\.json$/.exec(path);

type Namespaces = Record<string, Record<string, unknown>>;

/// Suma los textos de los módulos a los del núcleo, en el orden de moduleComposition.
function withModuleTexts(core: Namespaces, modules: readonly (Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined)[]): Namespaces {
  const resources = { ...core };
  for (const namespaces of modules) {
    for (const [namespace, content] of Object.entries(namespaces ?? {})) resources[namespace] = { ...(resources[namespace] ?? {}), ...content };
  }
  return resources;
}

const initialCore: Namespaces = {};
for (const [path, content] of Object.entries(initialFiles)) {
  const match = localeFileOf(path);
  if (match) initialCore[match[2]] = content;
}
const packagedResources: Record<string, Namespaces> = {
  [initialLanguage]: withModuleTexts(initialCore, moduleComposition.map((module) => {
    const texts = module.resources?.[initialLanguage];
    if (typeof texts === "function") throw new Error(`Los textos ${initialLanguage} del módulo ${module.id} van cargados.`);
    return texts;
  })),
};

/// Los idiomas que la app sabe mostrar: los que tienen el namespace común.
const packagedLanguages = new Set([initialLanguage, ...Object.keys(laterFiles).flatMap((path) => {
  const match = localeFileOf(path);
  return match && match[2] === "common" ? [match[1]] : [];
})]);

const loadingLanguages = new Map<string, Promise<void>>();

/// Baja una sola vez los textos de un idioma, del núcleo y de cada módulo.
export function loadLanguage(language: string): Promise<void> {
  if (packagedResources[language]) return Promise.resolve();
  let loading = loadingLanguages.get(language);
  if (!loading) {
    loading = (async () => {
      const files = Object.entries(laterFiles).filter(([path]) => localeFileOf(path)?.[1] === language);
      const core: Namespaces = {};
      await Promise.all(files.map(async ([path, load]) => { core[localeFileOf(path)![2]] = await load(); }));
      const modules = await Promise.all(moduleComposition.map(async (module) => {
        const texts = module.resources?.[language];
        return typeof texts === "function" ? texts() : texts;
      }));
      packagedResources[language] = withModuleTexts(core, modules);
    })();
    loadingLanguages.set(language, loading);
    // Un fallo de red no queda guardado: la próxima configuración vuelve a intentarlo.
    loading.catch(() => loadingLanguages.delete(language));
  }
  return loading;
}

void i18n.use(initReactI18next).init({
  resources: { [initialLanguage]: packagedResources[initialLanguage] },
  lng: initialLanguage,
  fallbackLng: initialLanguage,
  ns: Object.keys(packagedResources[initialLanguage]),
  defaultNS: "common",
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: true },
});
let enabledCultures = new Map<string, CultureLocale>();
let defaultCulture: string | null = null;

function fallbackFor(requested: string | undefined): string[] {
  if (defaultCulture === null) return [];
  const fallback = requested === undefined ? null : enabledCultures.get(requested)?.fallbackCulture;
  return fallback && enabledCultures.has(fallback)
    ? [fallback, defaultCulture]
    : [defaultCulture];
}

i18n.on("languageChanged", (culture) => {
  const language = enabledCultures.get(culture)?.languageCode;
  if (language && typeof document !== "undefined") document.documentElement.lang = language;
});

/// La cultura efectiva que ya aplicó i18n; `null` hasta que llega el catálogo.
export function effectiveCulture(): string | null {
  return enabledCultures.has(i18n.language) ? i18n.language : null;
}

function onLanguageChanged(notify: () => void): () => void {
  i18n.on("languageChanged", notify);
  return () => i18n.off("languageChanged", notify);
}

/// La cultura efectiva en un componente: la usan los formatos, el catálogo y las pantallas que la mandan a la API.
export function useEffectiveCulture(): string | null {
  return useSyncExternalStore(onLanguageChanged, effectiveCulture, effectiveCulture);
}

// Se llama cuando llega el catálogo, con la cultura efectiva (resolveCulture); sin ella, la de este navegador o la
// predeterminada. Mientras tanto, la app muestra su estado de carga.
export async function configureI18n(cultures: readonly CultureLocale[], culture?: string | null): Promise<void> {
  const enabled = cultures.filter((culture) => culture.isEnabled);
  const defaults = enabled.filter((culture) => culture.isDefault);
  if (defaults.length !== 1) throw new Error("Cultures debe tener una sola cultura predeterminada habilitada");

  for (const culture of enabled) {
    if (!packagedLanguages.has(culture.languageCode)) {
      throw new Error(`Faltan traducciones para ${culture.code}`);
    }
  }
  // Con los idiomas ya bajados no se espera: la configuración sigue siendo inmediata, como antes.
  const missing = enabled.filter((culture) => !packagedResources[culture.languageCode]);
  if (missing.length > 0) await Promise.all(missing.map((culture) => loadLanguage(culture.languageCode)));

  enabledCultures = new Map(enabled.map((culture) => [culture.code, culture]));
  defaultCulture = defaults[0].code;
  const chosen = culture && enabledCultures.has(culture) ? culture : resolveCulture({ chosen: chosenCulture(), cultures: enabled });

  const resources: Resource = {};
  for (const culture of enabled) resources[culture.code] = packagedResources[culture.languageCode];
  await i18n.init({
    resources,
    lng: chosen,
    fallbackLng: fallbackFor,
    supportedLngs: [...enabledCultures.keys()],
    load: "currentOnly",
    ns: Object.keys(resources[chosen]),
    defaultNS: "common",
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
  });
}

/// La persona elige una cultura en este navegador (el idioma de las pantallas públicas, o la de su cuenta al guardarla).
export async function changeCulture(culture: string): Promise<void> {
  if (!enabledCultures.has(culture)) throw new Error(`La cultura ${culture} no está habilitada`);
  safeStorageSet(cultureStorageKey, culture);
  await i18n.changeLanguage(culture);
}

export default i18n;
