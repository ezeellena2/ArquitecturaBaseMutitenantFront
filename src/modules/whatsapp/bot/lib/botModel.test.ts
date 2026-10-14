import { describe, expect, it } from "vitest";
import type { PlatformWhatsAppBotResponse, WhatsAppBotResponse } from "../../api/types";
import { maxMenuOptions, numberBotRequest, platformBotRequest } from "./botModel";

const schedule = { timeZoneId: "America/Argentina/Buenos_Aires", days: [{ day: "Monday" as const, from: "09:00:00", to: "18:00:00" }] };
const bot: WhatsAppBotResponse = { numberId: "n1", welcome: "Hola", outOfHours: "Cerrado", schedule, askPromotions: true, offerAccountLink: false,
  employeesTeamId: "t-int", version: 9, menu: [
    { id: "o1", label: "Hacer un pedido", action: "Team", teamId: "t-sales", reply: "sobra", isSystem: false },
    { id: "o2", label: "Horarios", action: "Reply", teamId: "t-sales", reply: "De 9 a 18", isSystem: false },
  ] };

describe("el PUT del bot", () => {
  it("lleva todo lo guardado con el cambio encima y la versión leída, y cada opción solo con lo que usa", () => {
    expect(numberBotRequest(bot, { welcome: "Buenas" })).toEqual({
      welcome: "Buenas", outOfHours: "Cerrado", schedule, askPromotions: true, offerAccountLink: false, employeesTeamId: "t-int", version: 9,
      menu: [
        { id: "o1", label: "Hacer un pedido", action: "Team", teamId: "t-sales", reply: null },
        { id: "o2", label: "Horarios", action: "Reply", teamId: null, reply: "De 9 a 18" },
      ],
    });
  });

  it("en Plataforma no manda «Además» ni la opción del sistema, que no se edita", () => {
    const platform: PlatformWhatsAppBotResponse = { welcome: "Hola", outOfHours: "Cerrado", schedule, version: 2, menu: [
      { id: "s1", label: "Entrar a mi cuenta", action: "Reply", reply: null, isSystem: true },
      { id: "o3", label: "Hablar con alguien", action: "Team", teamId: "t-ops", isSystem: false },
    ] };
    expect(platformBotRequest(platform, { askPromotions: false })).toEqual({ welcome: "Hola", outOfHours: "Cerrado", schedule, version: 2,
      menu: [{ id: "o3", label: "Hablar con alguien", action: "Team", teamId: "t-ops", reply: null }] });
  });

  it("el tope del menú sale del contrato", () => {
    expect(maxMenuOptions).toBe(10);
  });
});
