import { afterEach, expect, it, vi } from "vitest";
import { daysUntil, isPast, now, resetServerClock, synchronizeServerClock } from "./serverClock";

afterEach(() => { resetServerClock(); vi.restoreAllMocks(); });

it("ignora la fecha adelantada de la compu y avanza por tiempo monotónico tras sincronizar HTTP Date", () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2036-10-12T12:00:00Z"));
  const elapsed = vi.spyOn(performance, "now").mockReturnValue(100);
  synchronizeServerClock("Mon, 12 Oct 2026 12:00:00 GMT");
  expect(now()).toBe(Date.parse("2026-10-12T12:00:00Z"));
  expect(isPast("2026-10-13T12:00:00Z")).toBe(false);
  expect(daysUntil("2026-10-18T12:00:00Z")).toBe(6);
  vi.mocked(Date.now).mockReturnValue(0);
  elapsed.mockReturnValue(1100);
  expect(now()).toBe(Date.parse("2026-10-12T12:00:01Z"));
  expect(isPast("2026-10-12T12:00:01Z")).toBe(true);
});

it("no deja que respuestas sin fecha o concurrentes anteriores atrasen el reloj sincronizado", () => {
  vi.spyOn(performance, "now").mockReturnValue(100);
  synchronizeServerClock("Mon, 12 Oct 2026 12:00:00 GMT");
  synchronizeServerClock(null);
  synchronizeServerClock("invalid");
  synchronizeServerClock("Mon, 12 Oct 2026 11:59:00 GMT");
  expect(now()).toBe(Date.parse("2026-10-12T12:00:00Z"));
});

it("una respuesta demorada no hace volver a estar vigente un vencimiento", () => {
  const elapsed = vi.spyOn(performance, "now").mockReturnValue(100);
  synchronizeServerClock("Mon, 12 Oct 2026 12:00:00 GMT");
  elapsed.mockReturnValue(60_100);
  expect(isPast("2026-10-12T12:00:30Z")).toBe(true);
  synchronizeServerClock("Mon, 12 Oct 2026 12:00:01 GMT");
  expect(now()).toBe(Date.parse("2026-10-12T12:01:00Z"));
  expect(isPast("2026-10-12T12:00:30Z")).toBe(true);
});
