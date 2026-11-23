type PhoneCase = { id: string; viewport: { width: number; height: number } };
export function at320<T extends PhoneCase>(entry: T): Omit<T, "viewport"> & { viewport: { width: 320; height: T["viewport"]["height"] } } {
  if (entry.viewport.width !== 390) throw new Error(`${entry.id}: a 320 se compara con un tablero de 390`);
  return { ...entry, id: `${entry.id}-320`, viewport: { width: 320, height: entry.viewport.height } };
}
interface CoreCase { id: string; board: string; viewport: { width: 1440 | 390 | 320; height: 900 | 844 } }
interface ModuleCase { id: string; board: string; extra: "x"; viewport: { width: 1440 | 390; height: 900 | 844 } }
declare const core: CoreCase; declare const mod: ModuleCase;
const a: CoreCase = at320(core);
const b = at320(mod);
const list: Array<CoreCase | ModuleCase | ReturnType<typeof at320<ModuleCase>>> = [core, mod, b];
export { a, list };
