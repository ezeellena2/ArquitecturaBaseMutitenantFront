import { describe, expect, it } from "vitest";
import { noNotice, noticeFieldValue, noticeMinutesFrom } from "./notice";

describe("aviso por correo del equipo", () => {
  it("«No avisar» va a la API como null, y null vuelve como «No avisar»", () => {
    expect(noticeMinutesFrom(noNotice)).toBeNull();
    expect(noticeFieldValue(null)).toBe(noNotice);
    expect(noticeFieldValue(undefined)).toBe(noNotice);
  });

  it("los minutos van y vuelven tal cual, y algo que no es una opción no se manda", () => {
    expect(noticeMinutesFrom("15")).toBe(15);
    expect(noticeFieldValue(30)).toBe("30");
    expect(noticeMinutesFrom("20")).toBeNull();
  });
});
