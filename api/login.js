// GET /api/login?return=/path  →  GitHub's sign-in page
// No OAuth scope is requested: the site only ever reads the public profile.
import crypto from "node:crypto";
import { configured, json, redirect, seal, cookie, safeReturn, STATE } from "./_lib.js";

export default {
  async fetch(req) {
    if (!configured()) return json({ error: "Sign-in is not set up on this site yet." }, 503);
    const url = new URL(req.url);
    const state = crypto.randomBytes(16).toString("hex");
    const gh = new URL("https://github.com/login/oauth/authorize");
    gh.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
    gh.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
    gh.searchParams.set("state", state);
    const ret = safeReturn(url.searchParams.get("return"));
    return redirect(gh.toString(), [cookie(STATE, seal({ state, ret, exp: Date.now() + 10 * 60 * 1000 }), 600)]);
  },
};
