import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import timers from "node:timers/promises";
import { caseDelay, caseStage, newCaseContext, runCase } from "./test-e2e-real-case.mjs";

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

function context() {
  const resource = new EventEmitter();
  resource.closes = 0;
  resource.close = async () => { resource.closes++; resource.emit("close"); };
  return resource;
}

test("abortar el cooldown impide la etapa siguiente y cierra sólo los contextos de ese caso", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  const reason = new Error("Caso cancelado");
  const own = context();
  const secondary = context();
  const otherCase = context();
  const ready = deferred();
  const stages = [];
  const work = runCase(controller.signal, async () => {
    await newCaseContext({ newContext: async () => own });
    await newCaseContext({ newContext: async () => secondary });
    ready.resolve();
    await caseDelay(60_000);
    caseStage((stage) => stages.push(stage))("envía el pedido siguiente");
  });
  await ready.promise;
  controller.abort(reason);
  t.mock.timers.tick(60_000);
  await assert.rejects(work);
  assert.deepEqual(stages, []);
  assert.equal(own.closes, 1);
  assert.equal(secondary.closes, 1);
  assert.equal(otherCase.closes, 0);
});

test("una etapa no se publica ni continúa cuando la señal ya fue abortada", async () => {
  const controller = new AbortController();
  const reason = new Error("Caso cancelado");
  const stages = [];
  await assert.rejects(runCase(controller.signal, async () => {
    controller.abort(reason);
    caseStage((stage) => stages.push(stage))("escribe después de cancelar");
    stages.push("escritura posterior");
  }), (error) => error === reason);
  assert.deepEqual(stages, []);
});

test("la creación de un contexto que termina después del aborto lo cierra antes de continuar", async () => {
  const controller = new AbortController();
  const reason = new Error("Caso cancelado");
  const pending = deferred();
  const requested = deferred();
  const late = context();
  let continued = false;
  const work = runCase(controller.signal, async () => {
    await newCaseContext({ newContext: () => { requested.resolve(); return pending.promise; } });
    continued = true;
  });
  await requested.promise;
  controller.abort(reason);
  pending.resolve(late);
  await assert.rejects(work, (error) => error === reason);
  assert.equal(late.closes, 1);
  assert.equal(continued, false);
});

test("un caso abortado antes de comenzar no abre recursos ni ejecuta el recorrido", async () => {
  const controller = new AbortController();
  const reason = new Error("Caso cancelado");
  controller.abort(reason);
  let started = false;
  await assert.rejects(runCase(controller.signal, async () => { started = true; }), (error) => error === reason);
  assert.equal(started, false);
});

test("el éxito conserva el resultado y espera que termine el cierre del contexto", async () => {
  const closed = deferred();
  const closing = deferred();
  const own = context();
  own.close = async () => { own.closes++; closing.resolve(); await closed.promise; own.emit("close"); };
  let settled = false;
  const work = runCase(new AbortController().signal, async () => {
    await newCaseContext({ newContext: async () => own });
    return "recorrido completo";
  }).then((result) => { settled = true; return result; });
  // La escritura puede terminar antes de que el recurso libere sus operaciones.
  await Promise.race([closing.promise, work]);
  assert.equal(settled, false);
  closed.resolve();
  assert.equal(await work, "recorrido completo");
  assert.equal(own.closes, 1);
});

test("el fallo conserva el error original y cierra el contexto", async () => {
  const own = context();
  const failure = new Error("Fallo del recorrido");
  await assert.rejects(runCase(new AbortController().signal, async () => {
    await newCaseContext({ newContext: async () => own });
    throw failure;
  }), (error) => error === failure);
  assert.equal(own.closes, 1);
});

test("cancelar un recorrido no cierra los recursos de otro recorrido activo", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const first = new AbortController();
  const firstReady = deferred();
  const secondReady = deferred();
  const releaseSecond = deferred();
  const own = context();
  const other = context();
  const firstWork = runCase(first.signal, async () => {
    await newCaseContext({ newContext: async () => own });
    firstReady.resolve();
    await caseDelay(60_000);
  });
  const secondWork = runCase(new AbortController().signal, async () => {
    await newCaseContext({ newContext: async () => other });
    secondReady.resolve();
    await releaseSecond.promise;
    return "segundo completo";
  });
  await Promise.all([firstReady.promise, secondReady.promise]);
  first.abort(new Error("Primer caso cancelado"));
  t.mock.timers.tick(60_000);
  await assert.rejects(firstWork);
  assert.equal(own.closes, 1);
  assert.equal(other.closes, 0);
  releaseSecond.resolve();
  assert.equal(await secondWork, "segundo completo");
  assert.equal(other.closes, 1);
});

test("el recurso que el recorrido ya cerró no se cierra otra vez al terminar", async () => {
  const own = context();
  await runCase(new AbortController().signal, async () => {
    await newCaseContext({ newContext: async () => own });
    await own.close();
  });
  assert.equal(own.closes, 1);
});

test("un fallo al limpiar no sustituye el error del recorrido", async () => {
  const own = context();
  own.close = async () => { throw new Error("Fallo del cierre"); };
  const failure = new Error("Fallo original");
  await assert.rejects(runCase(new AbortController().signal, async () => {
    await newCaseContext({ newContext: async () => own });
    throw failure;
  }), (error) => error === failure);
});

test("el aborto espera también un cierre que ya emitió su evento pero aún no terminó", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  const ready = deferred();
  const closing = deferred();
  const closed = deferred();
  const own = context();
  own.close = async () => {
    own.closes++;
    own.emit("close");
    closing.resolve();
    await closed.promise;
  };
  let settled = false;
  const work = runCase(controller.signal, async () => {
    await newCaseContext({ newContext: async () => own });
    ready.resolve();
    await caseDelay(60_000);
  });
  const observed = work.catch((error) => { settled = true; return error; });
  await ready.promise;
  controller.abort(new Error("Caso cancelado"));
  t.mock.timers.tick(60_000);
  await closing.promise;
  // Un turno del event loop entrega los rechazos pendientes, sin esperar tiempo real.
  await timers.setImmediate();
  assert.equal(settled, false);
  closed.resolve();
  assert.ok(await observed instanceof Error);
  assert.equal(own.closes, 1);
});
