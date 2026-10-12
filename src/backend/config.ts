/**
 * Demo identity is OFF unless explicitly enabled AND not in production.
 * Set ALLOW_DEMO_IDENTITY=true in a local/dev environment only.
 */
export function demoModeEnabled(): boolean {
  return process.env.ALLOW_DEMO_IDENTITY === 'true' && process.env.NODE_ENV !== 'production';
}
