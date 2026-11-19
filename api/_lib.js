// Shared helpers for the sign-in + progress-sync functions.
// Files in /api that start with "_" are not deployed as endpoints.
import crypto from "node:crypto";

export const SESSION = "gvl_session";
export const STATE = "gvl_oauth";
export const DAY = 24 * 60 * 60;

export function configured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

// The session cookie is encrypted with a key derived from the OAuth client
// secret, so there is no extra secret to manage. Rotating the client secret
// signs everyone out, which is the behaviour you want anyway.
function key() {
  return Buffer.from(crypto.hkdfSync("sha256", process.env.GITHUB_CLIENT_SECRET, "learn-git-visually", "session-v1", 32));
}
export function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64url");
}
export function unseal(s) {
  if (!s) return null;
  try {
    const b = Buffer.from(s, "base64url");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
    if (o.exp && o.exp < Date.now()) return null;
    return o;
  } catch {
    return null;
  }
}

export function readCookies(req) {
  const out = {};
  (req.headers.get("cookie") || "").split(/;\s*/).forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}
export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function currentUser(req) {
  if (!configured()) return null;
  return unseal(readCookies(req)[SESSION]);
}

export function json(data, status = 200, extra) {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  (extra || []).forEach(([k, v]) => h.append(k, v));
  return new Response(JSON.stringify(data), { status, headers: h });
}
export function redirect(location, setCookies) {
  const h = new Headers({ location, "cache-control": "no-store" });
  (setCookies || []).forEach((c) => h.append("set-cookie", c));
  return new Response(null, { status: 302, headers: h });
}
// only same-site relative paths, never //host or absolute URLs
export function safeReturn(p) {
  return typeof p === "string" && /^\/(?![\/\\])[A-Za-z0-9\-._~\/?=&%]*$/.test(p) ? p : "/";
}

// ---------------------------------------------------------------- progress data
const SLUG = /^[a-z0-9-]{1,40}$/;
const MAX_BYTES = 64 * 1024;
export { MAX_BYTES };

// keep only the shapes the site writes; anything else is dropped
export function clean(d) {
  const out = {};
  if (!d || typeof d !== "object") return out;
  for (const k of ["done", "pg"]) {
    if (d[k] && typeof d[k] === "object") {
      const m = {};
      for (const s of Object.keys(d[k])) if (SLUG.test(s) && d[k][s] === true) m[s] = true;
      out[k] = m;
    }
  }
  if (typeof d.last === "string" && SLUG.test(d.last)) out.last = d.last;
  for (const k of Object.keys(d)) {
    const m = k.match(/^score:([a-z0-9-]{1,40})$/);
    if (!m || !d[k] || typeof d[k] !== "object") continue;
    const s = {};
    for (const c of Object.keys(d[k])) if (/^c\d{1,3}$/.test(c) && (d[k][c] === "got" || d[k][c] === "miss")) s[c] = d[k][c];
    out[k] = s;
  }
  return out;
}

// finished stays finished; for answers, the newest write wins per question
export function mergeInto(stored, incoming) {
  const out = JSON.parse(JSON.stringify(stored || {}));
  for (const k of Object.keys(incoming)) {
    if (k === "done" || k === "pg") out[k] = Object.assign({}, out[k], incoming[k]);
    else if (k.startsWith("score:")) out[k] = Object.assign({}, out[k], incoming[k]);
    else if (k === "last") out.last = incoming.last;
  }
  return out;
}

// ---------------------------------------------------------------- storage
// Private Vercel Blob in production. GVL_LOCAL_STORE (a folder path) is only
// for local testing and is never set on Vercel.
export async function loadProgress(userId) {
  const path = `progress/${userId}.json`;
  if (process.env.GVL_LOCAL_STORE) {
    const fs = await import("node:fs/promises");
    try { return JSON.parse(await fs.readFile(`${process.env.GVL_LOCAL_STORE}/${userId}.json`, "utf8")); } catch { return {}; }
  }
  const { get } = await import("@vercel/blob");
  const r = await get(path, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return {};
  try { return JSON.parse(await new Response(r.stream).text()); } catch { return {}; }
}
export async function saveProgress(userId, data) {
  const body = JSON.stringify(data);
  if (process.env.GVL_LOCAL_STORE) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(process.env.GVL_LOCAL_STORE, { recursive: true });
    await fs.writeFile(`${process.env.GVL_LOCAL_STORE}/${userId}.json`, body);
    return;
  }
  const { put } = await import("@vercel/blob");
  await put(`progress/${userId}.json`, body, {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
  });
}
