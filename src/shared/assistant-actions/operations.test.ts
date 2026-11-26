import { describe, expect, it } from "vitest";
import { assistantActions, type AssistantActionContract } from "@/shared/api/generated/assistant-actions";
import type { AssistantProposalValueResponse } from "@/shared/api/types";
import {
  applyAssistantProposal, assistantProposalChanges, assistantProposalDoubts, decodeAssistantProposal, emptyAssistantProposalValues,
  type AssistantProposalValues,
} from "./operations";

const contractOf = (id: string) => assistantActions.find((action) => `${action.id}@${action.version}` === id)!;
const invite = contractOf("users.invite@1");
const editUser = contractOf("users.edit@1");

// Ninguna acción de Usuarios y Roles tiene filas: un `Items` de prueba con su clave y su tope (ADR 0068 §4).
const faq: AssistantActionContract = {
  id: "help.edit", version: 1, kind: "edit", requirement: { kind: "organization", permission: "help.manage" }, saveRoute: "PUT api/help/{id}",
  confirmation: "page", screen: "help", effect: "none", fieldsFromTarget: false,
  fields: [{ name: "questions", type: "items", required: false, maxItems: 3, itemKey: "question",
    itemFields: [{ name: "question", type: "text", required: true, maxLength: 40 }, { name: "answer", type: "longText", required: true, maxLength: 80 }] }],
};

const value = (field: string, entry: unknown, label?: string, doubt?: string): AssistantProposalValueResponse => ({ field, value: entry, label, doubt });

describe("las operaciones de una propuesta", () => {
  it("crear carga lo propuesto, cada rol con su nombre y su duda", () => {
    const operations = decodeAssistantProposal(invite, [
      value("email", "ana@example.test"),
      value("roles", { op: "add", id: "r-1" }, "Ventas", "Assistant.Action.Doubt.Similar"),
      value("roles", { op: "add", id: "r-2" }, "Compras"),
      value("company", "c-1", "Delta S.A."),
    ])!;
    const next = applyAssistantProposal(invite, emptyAssistantProposalValues, operations)!;

    expect(next.fields.email).toEqual({ value: "ana@example.test", label: undefined });
    expect(next.fields.company).toEqual({ value: "c-1", label: "Delta S.A." });
    expect(next.lists.roles).toEqual([{ id: "r-1", label: "Ventas" }, { id: "r-2", label: "Compras" }]);
    const doubts = assistantProposalDoubts(operations);
    expect(doubts.get("roles:r-1")).toBe("Assistant.Action.Doubt.Similar");
    expect(doubts.get("roles:r-2")).toBeUndefined();
  });

  it.each([
    ["un campo que la acción no declara", [value("phone", "+5491100000000")]],
    ["un texto más largo que su campo", [value("email", `${"a".repeat(260)}@example.test`)]],
    ["un tipo que no es el del campo", [value("email", 42)]],
    ["una opción sin su nombre", [value("company", "c-1")]],
    ["un rol que se suma sin su nombre", [value("roles", { op: "add", id: "r-1" })]],
    ["una lista entera en vez de operaciones", [value("roles", ["r-1", "r-2"], "Ventas")]],
    ["dos valores para el mismo campo", [value("email", "a@example.test"), value("email", "b@example.test")]],
    ["el mismo rol dos veces", [value("roles", { op: "add", id: "r-1" }, "Ventas"), value("roles", { op: "add", id: "r-1" }, "Ventas")]],
    ["sumar y quitar el mismo rol", [value("roles", { op: "add", id: "r-1" }, "Ventas"), value("roles", { op: "remove", id: "r-1" }, "Ventas")]],
    ["un rol sin id", [value("email", "a@example.test"), value("roles", { op: "add", id: "" }, "Vacío")]],
  ])("rechaza %s: la pantalla no abre la propuesta", (_case, values) => {
    expect(decodeAssistantProposal(invite, values)).toBeUndefined();
  });

  it("al crear no se quita nada: no se puede mostrar", () => {
    const operations = decodeAssistantProposal(invite, [value("roles", { op: "remove", id: "r-1" }, "Ventas")])!;
    expect(applyAssistantProposal(invite, emptyAssistantProposalValues, operations)).toBeUndefined();
  });

  it("editar suma y quita sobre lo leído, sin reemplazar la lista, y «Lo que cambia» dice las dos cosas", () => {
    const current: AssistantProposalValues = { fields: {}, lists: { roles: [{ id: "r-1", label: "Ventas" }, { id: "r-3", label: "Depósito" }] }, rows: {} };
    const operations = decodeAssistantProposal(editUser, [
      value("roles", { op: "add", id: "r-2" }, "Compras"),
      value("roles", { op: "remove", id: "r-3" }, "Depósito viejo"),
      // Sumar lo que ya tiene o quitar lo que no tiene no cambia nada: se cuenta sobre lo de ahora.
      value("roles", { op: "add", id: "r-1" }, "Ventas"),
      value("roles", { op: "remove", id: "r-9" }, "Ya no está"),
    ])!;
    const next = applyAssistantProposal(editUser, current, operations)!;

    expect(next.lists.roles).toEqual([{ id: "r-1", label: "Ventas" }, { id: "r-2", label: "Compras" }]);
    expect(assistantProposalChanges(editUser, current, next).lists).toEqual([
      { field: "roles", added: [{ id: "r-2", label: "Compras" }], removed: [{ id: "r-3", label: "Depósito" }] },
    ]);
  });

  it("una lista que pasa su tope no entra", () => {
    const limited: AssistantActionContract = { ...editUser, fields: [{ name: "roles", type: "choices", required: false, maxItems: 1 }] };
    const operations = decodeAssistantProposal(limited, [value("roles", { op: "add", id: "r-2" }, "Compras")])!;
    expect(applyAssistantProposal(limited, { fields: {}, lists: { roles: [{ id: "r-1", label: "Ventas" }] }, rows: {} }, operations)).toBeUndefined();
  });

  it("«Lo que cambia» muestra las filas de un Items que se suman, se quitan o cambian, por su clave", () => {
    const current: AssistantProposalValues = { fields: {}, lists: {}, rows: { questions: [
      { key: "horario", label: "Horario", values: { question: "Horario", answer: "De 9 a 18" } },
      { key: "envios", label: "Envíos", values: { question: "Envíos", answer: "A todo el país" } },
      { key: "pagos", label: "Pagos", values: { question: "Pagos", answer: "Tarjeta" } },
    ] } };
    const operations = decodeAssistantProposal(faq, [
      value("questions", { op: "change", key: "horario", row: { answer: "De 8 a 20" } }, "Horario"),
      value("questions", { op: "remove", key: "envios" }, "Envíos"),
      value("questions", { op: "add", key: "cambios", row: { question: "Cambios", answer: "30 días" } }, "Cambios"),
      // Cambiar una fila que ya no está no cambia nada.
      value("questions", { op: "change", key: "retiro", row: { answer: "En el local" } }, "Retiro"),
    ])!;
    const next = applyAssistantProposal(faq, current, operations)!;
    const [rows] = assistantProposalChanges(faq, current, next).rows;

    expect(rows.added).toEqual([{ key: "cambios", label: "Cambios", values: { question: "Cambios", answer: "30 días" } }]);
    expect(rows.removed.map((row) => row.key)).toEqual(["envios"]);
    expect(rows.changed).toEqual([{ before: current.rows.questions[0], after: { key: "horario", label: "Horario", values: { question: "Horario", answer: "De 8 a 20" } } }]);
    expect(next.rows.questions.map((row) => row.key)).toEqual(["horario", "pagos", "cambios"]);
  });

  it.each([
    ["una fila con un campo que no declara", { op: "add", key: "x", row: { question: "X", link: "https://example.test" } }],
    ["una fila con un texto más largo que su campo", { op: "add", key: "x", row: { question: "X".repeat(41) } }],
    ["una fila sin clave", { op: "add", row: { question: "X" } }],
  ])("rechaza %s", (_case, entry) => {
    expect(decodeAssistantProposal(faq, [value("questions", entry, "X")])).toBeUndefined();
  });

  it("una fila de más que pasa el tope no entra", () => {
    const current: AssistantProposalValues = { fields: {}, lists: {}, rows: { questions: ["a", "b", "c"].map((key) => ({ key, values: { question: key } })) } };
    const operations = decodeAssistantProposal(faq, [value("questions", { op: "add", key: "d", row: { question: "d" } }, "d")])!;
    expect(applyAssistantProposal(faq, current, operations)).toBeUndefined();
  });

  it("un campo simple que queda igual no aparece en «Lo que cambia»", () => {
    const editRole = contractOf("roles.edit@1");
    const current: AssistantProposalValues = { fields: { name: { value: "Ventas" }, description: { value: "Vende" } }, lists: {}, rows: {} };
    const operations = decodeAssistantProposal(editRole, [value("name", "Ventas"), value("description", "Vende y cobra")])!;
    const changes = assistantProposalChanges(editRole, current, applyAssistantProposal(editRole, current, operations)!);

    expect(changes.fields).toEqual([{ field: "description", before: { value: "Vende" }, after: { value: "Vende y cobra", label: undefined } }]);
  });
});
