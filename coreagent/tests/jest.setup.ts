// Jest setup for OneAgent tests
process.env.NODE_ENV = 'test';

// Prevent accidental hard exits in tests. Instead, throw so Jest captures a failure.
// Only wrap once.
const STATE_SYMBOL: unique symbol = Symbol.for('oneagent.testHarnessState');
type HarnessState = {
  exitGuardInstalled: boolean;
  originalExit?: (code?: number) => never;
  consoleGuardInstalled: boolean;
};
const g = globalThis as Record<PropertyKey, unknown>;
if (!g[STATE_SYMBOL]) {
  g[STATE_SYMBOL] = { exitGuardInstalled: false, consoleGuardInstalled: false } as HarnessState;
}
const harnessState = g[STATE_SYMBOL] as HarnessState;

if (!harnessState.exitGuardInstalled) {
  harnessState.exitGuardInstalled = true;
  const originalExit = process.exit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).exit = (code?: number): never => {
    const err = new Error(
      `process.exit(${code ?? 0}) was called inside a test. Replace with throwing or expect assertions.`,
    );
    // Preserve stack for debugging.
    throw err;
  };
  process.on('beforeExit', () => {
    // No-op: just here to ensure process doesn't silently swallow.
  });
  // Keep a reference in case future setup wants to restore.
  harnessState.originalExit = originalExit as never;
}

// Suppress console output that occurs after Jest thinks the test is finished.
// We monkey-patch common console methods to track if a test is currently running.
if (!harnessState.consoleGuardInstalled) {
  harnessState.consoleGuardInstalled = true;
  const methods: Array<'log' | 'info' | 'warn' | 'error'> = ['log', 'info', 'warn', 'error'];
  const active: { inTest: boolean } = { inTest: false };

  // Jest provides hooks; we rely on global beforeEach/afterEach here.
  beforeEach(() => {
    active.inTest = true;
  });
  afterEach(() => {
    active.inTest = false;
  });

  methods.forEach(<K extends (typeof methods)[number]>(m: K) => {
    const orig = console[m].bind(console) as (...args: unknown[]) => void;
    Object.defineProperty(console, m, {
      configurable: true,
      enumerable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (...args: any[]) => {
        if (!active.inTest) {
          return; // swallow late logs
        }
        orig(...args);
      },
    });
  });
}
