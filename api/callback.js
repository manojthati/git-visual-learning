// GET /api/callback?code=…&state=…  (GitHub sends the learner back here)
// Swaps the code for a token, reads who signed in, then revokes the token:
// the site keeps only the GitHub id, username and avatar in an encrypted cookie.
import { configured, json, redirect, seal, unseal, cookie, readCookies, SESSION, STATE, DAY } from "./_lib.js";

function back(path, flag, cookies) {
  const sep = path.includes("?") ? "&" : "?";
  return redirect(path + sep + "signin=" + flag, cookies);
}

export default {
  async fetch(req) {
    if (!configured()) return json({ error: "Sign-in is not set up on this site yet." }, 503);
    const url = new URL(req.url);
    const clearState = cookie(STATE, "", 0);
    const st = unseal(readCookies(req)[STATE]);
    const code = url.searchParams.get("code");
    const ret = st && st.ret ? st.ret : "/";
    if (!st || !code || st.state !== url.searchParams.get("state")) return back(ret, "failed", [clearState]);

    const id = process.env.GITHUB_CLIENT_ID, secret = process.env.GITHUB_CLIENT_SECRET;
    let token;
    try {
      const tr = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: `${url.origin}/api/callback` }),
      });
      token = (await tr.json()).access_token;
    } catch { /* handled below */ }
    if (!token) return back(ret, "failed", [clearState]);

    let user;
    try {
      const ur = await fetch("https://api.github.com/user", {
        headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "learn-git-visually" },
      });
      user = await ur.json();
    } catch { /* handled below */ }

    // we never need the token again; revoke it (best effort)
    try {
      await fetch(`https://api.github.com/applications/${id}/token`, {
        method: "DELETE",
        headers: {
          authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
          accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "learn-git-visually",
        },
        body: JSON.stringify({ access_token: token }),
      });
    } catch { /* ignore */ }

    if (!user || !user.id) return back(ret, "failed", [clearState]);
    const session = seal({ id: user.id, login: user.login, avatar: user.avatar_url, exp: Date.now() + 30 * DAY * 1000 });
    return back(ret, "ok", [clearState, cookie(SESSION, session, 30 * DAY)]);
  },
};
