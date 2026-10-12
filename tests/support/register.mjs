import { register, createRequire } from 'node:module';
const require = createRequire(import.meta.url);
try {
  require.resolve('express');
} catch {
  register('./express-stub-loader.mjs', import.meta.url);
}
