// Lista explícita: una etapa posterior puede cerrarse mientras otra queda pendiente.
export const ClosedStages = [0, 1, 2, 3, 4, 6] as const;
export const HarnessStage = ClosedStages[ClosedStages.length - 1];

export function isStageClosed(stage: number): boolean {
  return (ClosedStages as readonly number[]).includes(stage);
}

export function areStagesClosed(first: number, last: number): boolean {
  if (first > last) return false;
  for (let stage = first; stage <= last; stage += 1) {
    if (!isStageClosed(stage)) return false;
  }
  return true;
}
