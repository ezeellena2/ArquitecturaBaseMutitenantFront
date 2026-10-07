import { AsyncLocalStorage } from "node:async_hooks";
import timers from "node:timers/promises";

const activeCase = new AsyncLocalStorage();

function closeContext(scope, context) {
  const owned = scope.contexts.get(context);
  if (!owned) return Promise.resolve();
  if (!owned.closing) {
    owned.closing = Promise.resolve().then(() => context.close());
    scope.closing.add(owned.closing);
  }
  return owned.closing;
}

async function closeContexts(scope) {
  for (const context of scope.contexts.keys()) closeContext(scope, context);
  // El evento «close» puede llegar antes de que cierre la promesa de Playwright.
  return Promise.allSettled([...scope.closing]);
}

// La señal de node:test cancela las esperas y los contextos de este recorrido.
// El caller espera esta promesa incluso cuando node:test ya declaró el timeout.
export async function runCase(signal, journey) {
  signal.throwIfAborted();
  const scope = { signal, contexts: new Map(), closing: new Set() };
  const aborted = () => { void closeContexts(scope); };
  signal.addEventListener("abort", aborted, { once: true });
  return activeCase.run(scope, async () => {
    let result;
    let error;
    let failed = false;
    try {
      result = await journey();
      signal.throwIfAborted();
    } catch (caught) { failed = true; error = caught; }
    signal.removeEventListener("abort", aborted);
    const closed = await closeContexts(scope);
    if (failed) throw error;
    const failure = closed.find((closedContext) => closedContext.status === "rejected");
    if (failure) throw failure.reason;
    return result;
  });
}

export function caseDelay(milliseconds) {
  const signal = activeCase.getStore()?.signal;
  signal?.throwIfAborted();
  return timers.setTimeout(milliseconds, undefined, { signal });
}

export async function newCaseContext(browser, options) {
  const scope = activeCase.getStore();
  scope?.signal.throwIfAborted();
  const context = await browser.newContext(options);
  if (scope) {
    scope.contexts.set(context, { closing: null });
    context.once("close", () => scope.contexts.delete(context));
    // También puede abortarse mientras Playwright está creando el contexto.
    if (scope.signal.aborted) {
      await closeContext(scope, context);
      scope.signal.throwIfAborted();
    }
  }
  return context;
}

export function caseStage(report) {
  return (stage) => {
    activeCase.getStore()?.signal.throwIfAborted();
    report(stage);
  };
}
