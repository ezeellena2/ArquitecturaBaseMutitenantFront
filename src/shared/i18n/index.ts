import i18n, { type Resource } from "i18next";
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

// Los archivos de interfaz son la fuente de idiomas disponibles. Las culturas y su fallback
// llegan por Cultures desde shared/referenceData; ninguna lista de culturas vive acá.
const localeFiles = import.meta.glob<Record<string, unknown>>("../../locales/*/*.json", {
  import: "default", eager: true,
});
const packagedResources: Resource = {};
for (const [path, content] of Object.entries(localeFiles)) {
  const match = /\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (match) (packagedResources[match[1]] ??= {})[match[2]] = content;
}
const documentLanguage = typeof document === "undefined" ? "es" : document.documentElement.lang.split("-")[0];
const initialLanguage = packagedResources[documentLanguage] ? documentLanguage : "es";
void i18n.use(initReactI18next).init({
  resources: packagedResources,
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

export function effectiveCulture(): string | null {
  return enabledCultures.has(i18n.language) ? i18n.language : null;
}

// Se llama cuando llega el catálogo. Mientras tanto, la app muestra su estado de carga.
export async function configureI18n(cultures: readonly CultureLocale[], preferredCulture?: string | null): Promise<void> {
  const enabled = cultures.filter((culture) => culture.isEnabled);
  const defaults = enabled.filter((culture) => culture.isDefault);
  if (defaults.length !== 1) throw new Error("Cultures debe tener una sola cultura predeterminada habilitada");

  for (const culture of enabled) {
    if (packagedResources[culture.languageCode]?.common === undefined) {
      throw new Error(`Faltan traducciones para ${culture.code}`);
    }
  }

  enabledCultures = new Map(enabled.map((culture) => [culture.code, culture]));
  defaultCulture = defaults[0].code;
  const stored = safeStorageGet(cultureStorageKey);
  const chosen = preferredCulture && enabledCultures.has(preferredCulture)
    ? preferredCulture
    : stored && enabledCultures.has(stored) ? stored : defaultCulture;

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

export async function changeCulture(culture: string): Promise<void> {
  if (!enabledCultures.has(culture)) throw new Error(`La cultura ${culture} no está habilitada`);
  safeStorageSet(cultureStorageKey, culture);
  await i18n.changeLanguage(culture);
}

export default i18n;
