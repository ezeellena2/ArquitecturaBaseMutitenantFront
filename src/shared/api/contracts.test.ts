import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../../..");
const generated = path.join(root, "scripts/generate-contracts.mjs");
const checker = path.join(root, "scripts/check-contracts.mjs");
const directories: string[] = [];

function fixture(): { source: string; target: string } {
  const directory = mkdtempSync(path.join(tmpdir(), "mt-contracts-"));
  directories.push(directory);
  const source = path.join(directory, "openapi.json");
  const target = path.join(directory, "schema.d.ts");
  writeFileSync(source, JSON.stringify({
    openapi: "3.0.1",
    info: { title: "Test API", version: "1.0.0" },
    paths: { "/api/example": { get: { responses: { 200: { description: "OK" } } } } },
  }));
  return { source, target };
}

function run(script: string, source: string, target: string, ci = false) {
  return spawnSync(process.execPath, [script, "--source", source, "--target", target], {
    encoding: "utf8",
    env: { ...process.env, CI: ci ? "true" : "" },
  });
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("OpenAPI contracts", () => {
  it("generates deterministic types and checks the current output", () => {
    const { source, target } = fixture();

    expect(run(generated, source, target).status).toBe(0);
    const first = readFileSync(target, "utf8");
    expect(first).toContain('"/api/example"');
    expect(run(generated, source, target).status).toBe(0);
    expect(readFileSync(target, "utf8")).toBe(first);
    expect(run(checker, source, target).status).toBe(0);
  }, 20_000);

  it("fails when the checked in schema is stale", () => {
    const { source, target } = fixture();
    expect(run(generated, source, target).status).toBe(0);
    writeFileSync(target, "stale");

    expect(run(checker, source, target).status).not.toBe(0);
  }, 20_000);

  // Git de Windows con core.autocrlf saca el schema con CRLF en una copia nueva (un worktree): el contenido es el
  // mismo, así que el chequeo no puede fallar por los finales de línea.
  it("accepts the checked in schema with Windows line endings", () => {
    const { source, target } = fixture();
    expect(run(generated, source, target).status).toBe(0);
    writeFileSync(target, readFileSync(target, "utf8").replace(/\r?\n/g, "\r\n"));

    expect(run(checker, source, target).status).toBe(0);
  }, 20_000);

  // ADR 0068: el back publica las acciones del asistente junto al OpenAPI, y el front las genera como dato tipado para
  // el registro de adaptadores y su cobertura (F5).
  it("generates the assistant actions next to the schema and checks them", () => {
    const { source, target } = fixture();
    const actions = path.join(path.dirname(source), "assistant-actions.json");
    const generatedActions = path.join(path.dirname(target), "assistant-actions.ts");
    const contract = { actions: [{ id: "users.invite", version: 1, kind: "create", requirement: { kind: "organization", permission: "users.invite" },
      saveRoute: "POST api/users/invitations", confirmation: "dialog", screen: "inviteUser", effect: "sendsMessage", fieldsFromTarget: false,
      fields: [{ name: "email", type: "email", required: true, maxLength: 254 }, { name: "roles", type: "choices", required: false }] }] };
    writeFileSync(actions, JSON.stringify(contract));

    expect(run(generated, source, target).status).toBe(0);
    const first = readFileSync(generatedActions, "utf8");
    expect(first).toContain('"users.invite"');
    expect(first).toContain("assistantActionKeys");
    expect(first).toContain('"users.invite@1"');
    expect(run(checker, source, target).status).toBe(0);

    writeFileSync(actions, JSON.stringify({ actions: [{ ...contract.actions[0], version: 2 }] }));
    const stale = run(checker, source, target);
    expect(stale.status).not.toBe(0);
    expect(stale.stdout + stale.stderr).toMatch(/assistant-actions\.ts is stale/);
  }, 20_000);

  it("requires the backend checkout locally and warns when CI lacks it", () => {
    const { source, target } = fixture();
    const missing = path.join(path.dirname(source), "missing-repo/docs/contracts/openapi.json");

    expect(run(checker, missing, target).status).not.toBe(0);
    const ci = run(checker, missing, target, true);
    expect(ci.status).toBe(0);
    expect(ci.stdout + ci.stderr).toMatch(/omit|skip/i);
  }, 20_000);
});
