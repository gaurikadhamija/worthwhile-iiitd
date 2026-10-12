export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'express') {
    return { url: new URL('./express-stub.mjs', import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
