/**
 * Assign each participant index to another index (derangement). Retries with
 * Fisher–Yates shuffle until no self-matches.
 */
export function assignSecretSanta(count: number, maxAttempts = 500): number[] {
  if (count < 2) {
    throw new Error("Minst 2 deltagare krävs");
  }
  const indices = Array.from({ length: count }, (_, i) => i);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const shuffled = fisherYates([...indices]);
    const ok = shuffled.every((target, i) => target !== i);
    if (ok) {
      return shuffled;
    }
  }

  throw new Error("Kunde inte skapa giltig julklappsdragning");
}

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
