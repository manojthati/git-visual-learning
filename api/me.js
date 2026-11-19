// GET /api/me  →  { configured, user: { login, avatar } | null }
import { configured, currentUser, json } from "./_lib.js";

export default {
  async fetch(req) {
    const u = currentUser(req);
    return json({ configured: configured(), user: u ? { login: u.login, avatar: u.avatar } : null });
  },
};
