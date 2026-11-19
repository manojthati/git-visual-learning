// POST /api/logout  →  forgets the session cookie (progress stays saved)
import { json, cookie, SESSION } from "./_lib.js";

export default {
  async fetch(req) {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405, [["allow", "POST"]]);
    return json({ ok: true }, 200, [["set-cookie", cookie(SESSION, "", 0)]]);
  },
};
