import { createInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import type { AssistantModelPriceResponse } from "@/shared/api/types";
import es from "@/locales/es/assistant.json";
import en from "@/locales/en/assistant.json";
import { modelErrorFields, modelFormSchema, modelFormValues } from "./modelForm";

const translation = createInstance();
beforeAll(async () => { await translation.init({ lng: "es", resources: { es: { assistant: es }, en: { assistant: en } }, initAsync: false }); });
const model: AssistantModelPriceResponse = { id: "model", name: "Conocido", provider: "Anthropic", providerModelId: "known",
  version: 17, isActive: true, inputPricePerMillion: { amount: 0, currency: "USD" }, outputPricePerMillion: { amount: 0.123456, currency: "USD" }, technicalRevision: "server-revision",
  technical: { supportsText: true, supportsTools: false, supportsImages: true, supportsPdf: false, supportsAdaptiveThinking: true,
    efforts: ["high", "low"], maxInputTokens: 200000, maxOutputTokens: 4096,
    cacheReadPricePerMillion: { amount: 0.012345, currency: "USD" }, cacheWrite5MinutesPricePerMillion: { amount: 0.2, currency: "USD" }, cacheWrite1HourPricePerMillion: { amount: 0.3, currency: "USD" }, longContext: null } };
const values = () => modelFormValues(model);
function parse(next: ReturnType<typeof values>, language = "es") { return modelFormSchema(translation.getFixedT(language)).safeParse(next); }
const tier = { inputTokensThreshold: 100000, inputPricePerMillion: { amount: 0.5, currency: "USD" }, outputPricePerMillion: { amount: 1, currency: "USD" },
  cacheReadPricePerMillion: { amount: 0.1, currency: "USD" }, cacheWrite5MinutesPricePerMillion: { amount: 0.6, currency: "USD" }, cacheWrite1HourPricePerMillion: { amount: 0.8, currency: "USD" } };

describe("formulario técnico del catálogo", () => {
  it("conserva las capacidades publicadas y tarifas, admite base cero y no copia revisión ni versión al formulario", () => {
    const result = parse(values()); expect(result.success).toBe(true);
    if (!result.success) throw result.error;
    expect(result.data.technical).toEqual({ ...model.technical, efforts: ["low", "high"] });
    expect(result.data.inputPricePerMillion?.amount).toBe(0);
    expect(result.data).not.toHaveProperty("technicalRevision"); expect(result.data).not.toHaveProperty("version");
  });
  it.each([undefined, { ...model, technical: null, technicalRevision: null }])("no inventa límites ni tarifas en un alta o lectura incompleta", (read) => {
    const next = modelFormValues(read);
    expect(next.technical.efforts).toEqual([]); expect(next.technical.maxInputTokens).toBeNull(); expect(next.technical.maxOutputTokens).toBeNull();
    expect(next.technical.cacheReadPricePerMillion).toBeNull(); expect(parse(next).success).toBe(false);
  });
  it.each([0, -1, 2147483648, 1.5, null])("rechaza límite fuera de int32 positivo: %s", (limit) => {
    const next = values(); next.technical.maxInputTokens = limit; expect(parse(next).success).toBe(false);
  });
  it("asocia salida superior al contexto a su campo", () => {
    const next = values(); next.technical.maxOutputTokens = 200001;
    const result = parse(next); expect(result.success).toBe(false);
    if (result.success) throw new Error("La salida superior no puede pasar.");
    expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["technical", "maxOutputTokens"] })]));
  });
  it.each([{ efforts: [] }, { efforts: ["medium", "medium"] }] as const)("requiere esfuerzos únicos y al menos uno: %j", ({ efforts }) => {
    const next = values(); next.technical.efforts = [...efforts]; expect(parse(next).success).toBe(false);
  });
  it.each([null, { amount: 0, currency: "USD" }, { amount: -1, currency: "USD" }, { amount: 1e12, currency: "USD" }, { amount: 1, currency: "ARS" }])("rechaza tarifa técnica inválida %j", (price) => {
    const next = values(); next.technical.cacheReadPricePerMillion = price; expect(parse(next).success).toBe(false);
  });
  it("un tramo largo completo conserva seis datos y un tramo vacío se elimina con null", () => {
    const next = values(); next.technical.longContext = tier;
    const result = parse(next); expect(result.success).toBe(true);
    if (!result.success) throw result.error;
    expect(result.data.technical.longContext).toEqual(tier);
    const cleared = parse(values()); expect(cleared.success).toBe(true);
    if (!cleared.success) throw cleared.error;
    expect(cleared.data.technical.longContext).toBeNull();
  });
  it.each(["inputTokensThreshold", "inputPricePerMillion", "outputPricePerMillion", "cacheReadPricePerMillion", "cacheWrite5MinutesPricePerMillion", "cacheWrite1HourPricePerMillion"] as const)("un tramo parcial señala el dato faltante %s", (field) => {
    const next = values(); next.technical.longContext = { ...tier, [field]: null };
    const result = parse(next); expect(result.success).toBe(false);
    if (result.success) throw new Error("Un tramo parcial no puede pasar.");
    expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["technical", "longContext", field] })]));
  });
  it.each([200000, 200001])("el umbral %s debe ser inferior al contexto", (threshold) => {
    const next = values(); next.technical.longContext = { ...tier, inputTokensThreshold: threshold }; expect(parse(next).success).toBe(false);
  });
  it.each([["es", "Elegí al menos un esfuerzo."], ["en", "Select at least one effort."]])("traduce la validación en %s", (language, message) => {
    const next = values(); next.technical.efforts = [];
    const result = parse(next, language); expect(result.success).toBe(false);
    if (result.success) throw new Error("Falta esfuerzo.");
    expect(result.error.issues.some((issue) => issue.message === message)).toBe(true);
  });
  it("mapea errores técnicos profundos del contrato y deja el desconocido al error general", () => {
    const fields = modelErrorFields();
    expect(fields["technical.longContext.cacheReadPricePerMillion.amount"]).toBe("technical.longContext.cacheReadPricePerMillion");
    expect(fields["technical.cacheWrite1HourPricePerMillion.currency"]).toBe("technical.cacheWrite1HourPricePerMillion");
    expect(fields["technical.efforts"]).toBe("technical.efforts"); expect(fields["technical.futureField"]).toBeUndefined();
  });
});
