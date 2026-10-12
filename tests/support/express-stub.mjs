// Minimal stand-in for `express` used ONLY when the real package is not installed (offline sandboxes).
// It supports exactly what src/backend/routes/api.ts needs: Router(), get/post/put/delete and handle().
export function Router() {
  const routes = [];
  const add = (method) => (path, handler) => {
    const keys = [];
    const rx = new RegExp('^' + path.replace(/:([A-Za-z_]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ method, rx, keys, handler });
  };
  const router = {
    get: add('GET'), post: add('POST'), put: add('PUT'), delete: add('DELETE'),
    async handle(req, res, next) {
      const path = req.url.split('?')[0];
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.rx.exec(path);
        if (!m) continue;
        req.params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        await r.handler(req, res, next);
        return;
      }
      next();
    },
  };
  return router;
}
export default { Router };
