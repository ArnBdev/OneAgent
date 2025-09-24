// Minimal jest-style globals for standalone smoke execution (not for full suite).
// Each test executes sequentially; failures throw and set process exit code.

type TestFn = () => Promise<void> | void;
interface TestCase {
  name: string;
  fn: TestFn;
}
const tests: TestCase[] = [];

(globalThis as any).describe = (_name: string, fn: () => void) => {
  fn();
};
(globalThis as any).it = (name: string, fn: TestFn) => {
  tests.push({ name, fn });
};
(globalThis as any).test = (name: string, fn: TestFn) => {
  tests.push({ name, fn });
};
// Minimal jest facade for tests that call jest.setTimeout
(globalThis as any).jest = {
  setTimeout: (_ms: number) => {
    // No-op: our runner executes sequentially without per-test timeout handling
  },
};
(globalThis as any).expect = (received: any) => ({
  toBeGreaterThanOrEqual: (min: number) => {
    if (!(received >= min)) throw new Error(`Expected ${received} >= ${min}`);
  },
  toBeTruthy: () => {
    if (!received) throw new Error('Expected value to be truthy');
  },
  toContain: (v: unknown) => {
    if (!Array.isArray(received) || !received.includes(v))
      throw new Error('Expected array to contain value');
  },
});

export async function runMiniTests(): Promise<void> {
  let failures = 0;
  for (const t of tests) {
    try {
      const r = t.fn();
      if (r instanceof Promise) await r;
      console.log(`✔ ${t.name}`);
    } catch (e) {
      failures++;
      console.error(`✖ ${t.name}:`, e);
    }
  }
  if (failures > 0) throw new Error(`Mini test runner: ${failures} failure(s)`);
}

// Run automatically if executed directly
if (require.main === module) runMiniTests();

export {}; // ensure module scope
