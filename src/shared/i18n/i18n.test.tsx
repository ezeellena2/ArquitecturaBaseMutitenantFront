import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import i18n, {
  changeCulture,
  configureI18n,
  cultureStorageKey,
  effectiveCulture,
  type CultureLocale,
} from "./index";

const cultures: CultureLocale[] = [
  {
    code: "es-AR",
    languageCode: "es",
    fallbackCulture: null,
    isEnabled: true,
    isDefault: true,
  },
  {
    code: "en-US",
    languageCode: "en",
    fallbackCulture: "es-AR",
    isEnabled: true,
    isDefault: false,
  },
  {
    code: "fr-FR",
    languageCode: "fr",
    fallbackCulture: "es-AR",
    isEnabled: false,
    isDefault: false,
  },
];

function Greeting() {
  const { t } = useTranslation("common");
  return <p>{t("actions.cancel")}</p>;
}

function renderGreeting() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>
    </I18nextProvider>,
  );
}

describe("i18n basado en Cultures", () => {
  afterEach(() => {
    localStorage.clear();
    i18n.removeResourceBundle("es-AR", "fallback-test");
  });

  it("usa la cultura marcada como predeterminada en el catálogo", async () => {
    await configureI18n(cultures);
    renderGreeting();

    expect(effectiveCulture()).toBe("es-AR");
    expect(i18n.language).toBe("es-AR");
    expect(document.documentElement.lang).toBe("es");
    expect(await screen.findByText("Cancelar")).toBeInTheDocument();
  });

  it("respeta la cultura local si el catálogo la tiene habilitada", async () => {
    localStorage.setItem(cultureStorageKey, "en-US");
    await configureI18n(cultures);
    renderGreeting();

    expect(effectiveCulture()).toBe("en-US");
    expect(document.documentElement.lang).toBe("en");
    expect(await screen.findByText("Cancel")).toBeInTheDocument();
  });

  it("ignora culturas locales ausentes o deshabilitadas", async () => {
    localStorage.setItem(cultureStorageKey, "fr-FR");
    await configureI18n(cultures);
    expect(effectiveCulture()).toBe("es-AR");

    localStorage.setItem(cultureStorageKey, "it-IT");
    await configureI18n(cultures);
    expect(effectiveCulture()).toBe("es-AR");
  });

  it("usa FallbackCulture cuando falta una clave en la cultura pedida", async () => {
    await configureI18n(cultures);
    i18n.addResourceBundle("es-AR", "fallback-test", { onlyInDefault: "Texto de respaldo" });

    expect(i18n.t("onlyInDefault", { lng: "en-US", ns: "fallback-test" })).toBe("Texto de respaldo");
  });

  it("guarda el cambio local y mantiene el idioma del documento", async () => {
    await configureI18n(cultures);
    await changeCulture("en-US");

    expect(localStorage.getItem(cultureStorageKey)).toBe("en-US");
    expect(effectiveCulture()).toBe("en-US");
    expect(document.documentElement.lang).toBe("en");
    await expect(changeCulture("fr-FR")).rejects.toThrow();
  });

  it("traduce avisos y el estado TestStatus del contrato compartido", async () => {
    await configureI18n(cultures);
    await i18n.loadNamespaces(["errors", "enums"]);
    expect(i18n.t("offline", { ns: "errors" })).toBe("Sin conexión");
    expect(i18n.t("TestStatus.Active", { ns: "enums" })).toBe("Activo");

    await changeCulture("en-US");
    expect(i18n.t("offline", { ns: "errors" })).toBe("Offline");
    expect(i18n.t("TestStatus.Active", { ns: "enums" })).toBe("Active");
  });
});
