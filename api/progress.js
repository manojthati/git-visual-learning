// GET /api/progress  →  { d: <saved progress> }
// PUT /api/progress  { d: <progress from this browser> }  →  { d: <merged> }
import { currentUser, json, clean, mergeInto, loadProgress, saveProgress, MAX_BYTES } from "./_lib.js";

export default {
  async fetch(req) {
    const u = currentUser(req);
    if (!u) return json({ error: "Not signed in" }, 401);

    if (req.method === "GET") return json({ d: clean(await loadProgress(u.id)) });

    if (req.method === "PUT" || req.method === "POST") {
      // JSON-only + same-origin: a cross-site form can't send this
      if (!(req.headers.get("content-type") || "").startsWith("application/json")) return json({ error: "Expected JSON" }, 415);
      const origin = req.headers.get("origin");
      if (origin) {
        let originHost = null;
        try { originHost = new URL(origin).host; } catch { /* malformed → refuse */ }
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
        if (originHost !== host) return json({ error: "Cross-site request refused" }, 403);
      }
      const text = await req.text();
      if (text.length > MAX_BYTES) return json({ error: "Too large" }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }
      const merged = mergeInto(clean(await loadProgress(u.id)), clean(body && body.d));
      await saveProgress(u.id, merged);
      return json({ d: merged });
    }
    return json({ error: "Method not allowed" }, 405, [["allow", "GET, PUT"]]);
  },
};
