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
  });

  it("requires the backend checkout locally and warns when CI lacks it", () => {
    const { source, target } = fixture();
    const missing = path.join(path.dirname(source), "missing-repo/docs/contracts/openapi.json");

    expect(run(checker, missing, target).status).not.toBe(0);
    const ci = run(checker, missing, target, true);
    expect(ci.status).toBe(0);
    expect(ci.stdout + ci.stderr).toMatch(/omit|skip/i);
  });
});
