import { describe, expect, it } from "vitest";
import type { PlatformWhatsAppBotResponse, WhatsAppBotMenuOption, WhatsAppBotResponse } from "../../api/types";
import { findMenuOption, maxMenuOptions, numberBotRequest, optionTarget, platformBotRequest, removeMenuOption, replaceMenuOption } from "./botModel";

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

  it("identifica, reemplaza y quita una opción por id aunque hayan corrido las posiciones, y cae a posición si no tiene id", () => {
    const original: WhatsAppBotMenuOption[] = [
      { id: "o1", label: "Uno", action: "Team", teamId: "t1", isSystem: false },
      { id: "o2", label: "Dos", action: "Team", teamId: "t1", isSystem: false },
      { id: "o3", label: "Tres", action: "Reply", reply: "Hola", isSystem: false },
    ];
    const [, o2, o3] = original;
    const target = optionTarget(o3, 2);
    const shifted = original.slice(1);

    expect(findMenuOption(shifted, target)).toEqual(o3);
    const edited: WhatsAppBotMenuOption = { ...o3, label: "Tres editado" };
    expect(replaceMenuOption(shifted, target, edited)).toEqual([o2, edited]);
    expect(removeMenuOption(shifted, target)).toEqual([o2]);

    const anonymous: WhatsAppBotMenuOption[] = [
      { id: null, label: "Sin id 1", action: "Team", teamId: "t1", isSystem: false },
      { id: null, label: "Sin id 2", action: "Team", teamId: "t1", isSystem: false },
    ];
    const byIndex = optionTarget(anonymous[1], 1);
    expect(findMenuOption(anonymous, byIndex)).toEqual(anonymous[1]);
    expect(removeMenuOption(anonymous, byIndex)).toEqual([anonymous[0]]);
  });
});
