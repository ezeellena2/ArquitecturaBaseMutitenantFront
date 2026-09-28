import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

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
const localeFiles = import.meta.glob<Record<string, unknown>>("../../locales/*/*.json", { import: "default" });
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
export async function configureI18n(cultures: readonly CultureLocale[]): Promise<void> {
  const enabled = cultures.filter((culture) => culture.isEnabled);
  const defaults = enabled.filter((culture) => culture.isDefault);
  if (defaults.length !== 1) throw new Error("Cultures debe tener una sola cultura predeterminada habilitada");

  for (const culture of enabled) {
    if (localeFiles[`../../locales/${culture.languageCode}/common.json`] === undefined) {
      throw new Error(`Faltan traducciones para ${culture.code}`);
    }
  }

  enabledCultures = new Map(enabled.map((culture) => [culture.code, culture]));
  defaultCulture = defaults[0].code;
  const stored = globalThis.localStorage?.getItem(cultureStorageKey);
  const chosen = stored && enabledCultures.has(stored) ? stored : defaultCulture;

  await i18n
    .use(resourcesToBackend(async (culture: string, namespace: string) => {
      const language = enabledCultures.get(culture)?.languageCode;
      const loader = localeFiles[`../../locales/${language}/${namespace}.json`];
      if (!loader) throw new Error(`Falta ${namespace} para ${culture}`);
      return loader();
    }))
    .use(initReactI18next)
    .init({
      lng: chosen,
      fallbackLng: fallbackFor,
      supportedLngs: [...enabledCultures.keys()],
      load: "currentOnly",
      ns: ["common"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
      react: { useSuspense: true },
    });
}

export async function changeCulture(culture: string): Promise<void> {
  if (!enabledCultures.has(culture)) throw new Error(`La cultura ${culture} no está habilitada`);
  await i18n.changeLanguage(culture);
  globalThis.localStorage?.setItem(cultureStorageKey, culture);
}

export default i18n;
