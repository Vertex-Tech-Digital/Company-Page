// Enrutador único para todos los endpoints del panel admin.
//
// Vercel factura por función serverless declarada bajo api/, con un límite
// de 12 en el plan actual — 15 archivos ahí lo superaba. Este archivo
// concentra 7 endpoints en 1 sola función; la lógica de cada uno vive sin
// cambios en ./_admin/*.js (movidos ahí tal cual, solo se ajustaron los
// require relativos).
//
// Las rutas públicas NO cambiaron: /api/admin-login, /api/admin-posts,
// /api/admin-moderation, /api/admin-invoices, /api/admin-me,
// /api/admin-logout y /api/invoices/create se reescriben hacia acá con
// ?action=<...> — ver vercel.json (producción) y dev-api-plugin.mjs (local).
// El resto del query string original (?id=, ?resource=, ?slug=, etc.) llega
// intacto en req.query junto con action.

const handlers = {
  login: require("./_admin/login.js"),
  logout: require("./_admin/logout.js"),
  me: require("./_admin/me.js"),
  posts: require("./_admin/posts.js"),
  moderation: require("./_admin/moderation.js"),
  invoices: require("./_admin/invoices.js"),
  "invoices-create": require("./_admin/invoices-create.js"),
};

module.exports = async function handler(req, res) {
  const action = req.query?.action;
  const target = handlers[action];

  if (!target) {
    return res.status(404).json({ error: "Not found" });
  }

  return target(req, res);
};
