import { describe, expect, it } from "vitest";
import { assistantActionComposition } from "@/app/assistantActionComposition";
import { assistantActions, type AssistantActionContract } from "@/shared/api/generated/assistant-actions";
import { assistantActionKey, type AssistantActionAdapter } from "./registry";

// ADR 0068: el front comprueba un adaptador por acción del contrato. Lee las acciones de los tipos que genera
// `npm run contracts` desde `assistant-actions.json` y los adaptadores que compone la app: una acción sin adaptador no se
// podría confirmar en ninguna pantalla. Es el único archivo de la carpeta que mira la composición (`boundaries.test.ts`).

type ContractAction = Pick<AssistantActionContract, "id" | "version">;
type Adapter = Pick<AssistantActionAdapter, "action">;

/** Lo que rompe «un adaptador por acción»: una acción sin adaptador, una con dos, o un adaptador de una acción que no está. */
function coverageProblems(actions: readonly ContractAction[], adapters: readonly Adapter[]): string[] {
  const keys = actions.map((action) => assistantActionKey(action.id, action.version));
  const count = (key: string) => adapters.filter((adapter) => adapter.action === key).length;
  return [
    ...keys.filter((key) => count(key) === 0).map((key) => `${key} no tiene adaptador`),
    ...keys.filter((key) => count(key) > 1).map((key) => `${key} tiene ${count(key)} adaptadores`),
    ...adapters.filter((adapter) => !keys.includes(adapter.action)).map((adapter) => `${adapter.action} no está en el contrato`),
  ];
}

describe("la cobertura de las acciones del asistente", () => {
  it("detecta una acción sin adaptador, una con dos y un adaptador que no está en el contrato", () => {
    const actions: ContractAction[] = [{ id: "users.invite", version: 1 }, { id: "users.edit", version: 1 }, { id: "users.remove", version: 1 }];
    const adapters = [{ action: "users.edit@1" }, { action: "users.edit@1" }, { action: "users.remove@1" }, { action: "users.remove@2" }] as Adapter[];
    expect(coverageProblems(actions, adapters)).toEqual([
      "users.invite@1 no tiene adaptador",
      "users.edit@1 tiene 2 adaptadores",
      "users.remove@2 no está en el contrato",
    ]);
  });

  it("cada acción de assistant-actions.json tiene un adaptador, y uno solo", () => {
    expect(assistantActions.length).toBeGreaterThan(0);
    expect(coverageProblems(assistantActions, assistantActionComposition)).toEqual([]);
  });
});
