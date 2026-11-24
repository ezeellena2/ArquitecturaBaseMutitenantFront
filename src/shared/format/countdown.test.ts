import { beforeEach, describe, expect, it } from "vitest";
import i18n, { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { formatCountdown, formatWait } from "./countdown";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("la espera de un pedido", () => {
  it("cuenta m:ss hasta una hora", () => {
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatWait(42, i18n.t)).toBe("0:42");
    expect(formatWait(0, i18n.t)).toBe("0:00");
    expect(formatWait(41.2, i18n.t)).toBe("0:42");
    expect(formatWait(3599, i18n.t)).toBe("59:59");
  });

  // 0063: un tope diario pide esperar hasta un día. Desde una hora va en horas y minutos, y los minutos se redondean para
  // arriba, como la cuenta lo hace al segundo: la espera nunca se muestra más corta de lo que es.
  it.each([
    [3600, "1 h"],
    [3601, "1 h 1 min"],
    [3660, "1 h 1 min"],
    [82345, "22 h 53 min"],
    [86400, "24 h"],
  ])("una espera de %i segundos se dice %s", (seconds, text) => {
    expect(formatWait(seconds, i18n.t)).toBe(text);
  });

  it("dice las horas y los minutos en inglés", async () => {
    await changeCulture("en-US");
    expect(formatWait(82345, i18n.t)).toBe("22 h 53 min");
    expect(formatWait(7200, i18n.t)).toBe("2 h");
  });
});
