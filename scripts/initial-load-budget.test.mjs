import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { initialLoadKiB, initialScripts } from "./initial-load-budget.mjs";

test("toma la entrada y los modulepreload, no el CSS ni otros enlaces", () => {
  const html = `<script type="module" crossorigin src="/assets/main-a.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/react-b.js">
    <link rel="stylesheet" crossorigin href="/assets/main-c.css">
    <link rel="icon" href="/favicon.svg">`;
  assert.deepEqual(initialScripts(html), ["assets/main-a.js", "assets/react-b.js"]);
});

test("suma el gzip de esos archivos", () => {
  const dist = mkdtempSync(path.join(tmpdir(), "peso-inicial-"));
  mkdirSync(path.join(dist, "assets"));
  writeFileSync(path.join(dist, "index.html"), `<script type="module" src="/assets/a.js"></script><link rel="modulepreload" href="/assets/b.js">`);
  writeFileSync(path.join(dist, "assets/a.js"), "x".repeat(10_000));
  writeFileSync(path.join(dist, "assets/b.js"), "y".repeat(10_000));
  const { files, kib } = initialLoadKiB(dist);
  assert.equal(files.length, 2);
  assert.ok(kib > 0 && kib < 1);
});
