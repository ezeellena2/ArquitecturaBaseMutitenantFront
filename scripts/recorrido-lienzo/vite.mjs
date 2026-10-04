import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

async function responds(url) {
  try {
    return (await fetch(`${url}/src/test/visualApp.html`, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

/// El servidor de Vite de la app: usa el que ya responde en esa dirección o prende uno, que se apaga al terminar.
/// Con Vite, cada cambio del código llega solo a la ventana.
export async function ensureVite(url, root) {
  if (await responds(url)) return { url, started: false, close: async () => {} };
  const child = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--port", new URL(url).port, "--strictPort"],
    { cwd: root, stdio: "ignore", windowsHide: true });
  const start = Date.now();
  while (!(await responds(url))) {
    if (Date.now() - start > 90_000 || child.exitCode !== null) {
      child.kill();
      throw new Error(`Vite no respondió en ${url}.`);
    }
    await delay(500);
  }
  return { url, started: true, close: async () => { child.kill(); } };
}
