import { describe, expect, it } from "vitest";
import { getStatusTone, statusTones } from "./statusTones";

describe("statusTones", () => {
  it("declara solo los cinco tonos del tema", () => {
    expect(statusTones.available).toEqual(["success", "warning", "danger", "neutral", "pending"]);
  });

  it("resuelve el estado de prueba y deja neutros los desconocidos", () => {
    expect(getStatusTone("TestStatus", "Active")).toBe("success");
    expect(getStatusTone("UnknownStatus", "Unknown")).toBe("neutral");
  });
});
