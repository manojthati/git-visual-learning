/* Move learning progress between browsers with a link.
   The progress travels inside the link's #fragment, which browsers never send
   to the server: nothing is uploaded or stored anywhere but the two browsers. */
(function(){
  "use strict";
  var PREFIX = "gvl:", SKIP = {"gvl:pg:hist": true}, MODULES = 12, CHALLENGES = 12;

  function store(){ try{ return window.localStorage; }catch(e){ return null; } }
  function get(k, d){ try{ var v = store().getItem(PREFIX + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }

  function collect(){
    var ls = store(), out = {};
    if(!ls) return out;
    for(var i = 0; i < ls.length; i++){
      var k = ls.key(i);
      if(k && k.indexOf(PREFIX) === 0 && !SKIP[k]){ try{ out[k.slice(PREFIX.length)] = JSON.parse(ls.getItem(k)); }catch(e){} }
    }
    return out;
  }
  function count(obj){ var n = 0; for(var k in obj || {}) if(obj[k]) n++; return n; }
  function summary(d){
    var answers = 0;
    for(var k in d) if(k.indexOf("score:") === 0) answers += count(d[k]);
    return count(d.done) + " of " + MODULES + " modules, " + count(d.pg) + " of " + CHALLENGES + " playground challenges, " + answers + " graded answers";
  }
  function encode(d){
    var json = JSON.stringify({v:1, d:d});
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(code){
    var b = code.replace(/-/g, "+").replace(/_/g, "/");
    while(b.length % 4) b += "=";
    var o = JSON.parse(decodeURIComponent(escape(atob(b))));
    if(!o || o.v !== 1 || typeof o.d !== "object") throw new Error("bad");
    return o.d;
  }
  function linkFor(d){
    var base = location.origin + location.pathname.replace(/[^\/]*$/, "");
    return base + "#import=" + encode(d);
  }
  // merge: finished stays finished; incoming answers fill in what this browser lacks
  function merge(incoming){
    var ls = store(); if(!ls) throw new Error("storage blocked");
    Object.keys(incoming).forEach(function(k){
      var cur = get(k, null), inc = incoming[k];
      if(k === "done" || k === "pg"){
        var m = cur && typeof cur === "object" ? cur : {};
        for(var x in inc) if(inc[x]) m[x] = true;
        ls.setItem(PREFIX + k, JSON.stringify(m));
      } else if(k.indexOf("score:") === 0){
        var s = cur && typeof cur === "object" ? cur : {};
        for(var y in inc) if(!(y in s)) s[y] = inc[y];
        ls.setItem(PREFIX + k, JSON.stringify(s));
      } else if(k === "last"){
        if(cur === null) ls.setItem(PREFIX + k, JSON.stringify(inc));
      }
    });
  }

  // ---------------------------------------------------------------- dialog
  var css = "#gvl-sync{border:1px solid rgba(56,189,248,.35);border-radius:16px;background:#0b1c2c;color:#e2e8f0;" +
    "padding:0;max-width:min(520px,calc(100vw - 32px));width:100%;font:14px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "#gvl-sync::backdrop{background:rgba(2,8,14,.72)}" +
    "#gvl-sync .in{padding:20px 22px}" +
    "#gvl-sync h2{margin:0 0 6px;font-size:18px}" +
    "#gvl-sync p{margin:0 0 12px;color:#94a3b8}" +
    "#gvl-sync .sum{color:#34d399;font:12.5px ui-monospace,Menlo,monospace;margin-bottom:14px}" +
    "#gvl-sync label{display:block;font:11px ui-monospace,Menlo,monospace;letter-spacing:1.2px;text-transform:uppercase;color:#38bdf8;margin:14px 0 6px}" +
    "#gvl-sync .row{display:flex;gap:8px}" +
    "#gvl-sync input{flex:1;min-width:0;background:#050e18;border:1px solid rgba(56,189,248,.3);border-radius:9px;color:#e2e8f0;padding:8px 10px;font:12px ui-monospace,Menlo,monospace}" +
    "#gvl-sync button{cursor:pointer;border-radius:9px;padding:8px 14px;border:1px solid #38bdf8;background:transparent;color:#38bdf8;font:12px ui-monospace,Menlo,monospace;white-space:nowrap}" +
    "#gvl-sync button.go{background:#38bdf8;color:#071320;font-weight:700}" +
    "#gvl-sync .foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;flex-wrap:wrap}" +
    "#gvl-sync .note{font-size:12px;color:#64748b}" +
    "#gvl-sync .msg{font:12px ui-monospace,Menlo,monospace;margin-top:8px;min-height:1em}" +
    "#gvl-sync .msg.err{color:#fb7185} #gvl-sync .msg.ok{color:#34d399}";

  function dialog(){
    var dlg = document.getElementById("gvl-sync");
    if(dlg) return dlg;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    dlg = document.createElement("dialog"); dlg.id = "gvl-sync";
    document.body.appendChild(dlg);
    return dlg;
  }
  function el(html){ var d = document.createElement("div"); d.className = "in"; d.innerHTML = html; return d; }

  function openSync(){
    var dlg = dialog(), d = collect();
    dlg.innerHTML = "";
    var box = el(
      "<h2>⇄ Your progress on another device</h2>" +
      "<p>Copy this link and open it in the other browser (phone, laptop, work computer). It adds your progress there.</p>" +
      '<div class="sum"></div>' +
      '<label>Your progress link</label><div class="row"><input readonly id="gvl-link"><button id="gvl-copy">Copy</button></div>' +
      '<label>Got a link from another device?</label><div class="row"><input id="gvl-paste" placeholder="Paste it here"><button id="gvl-import">Import</button></div>' +
      '<div class="msg" id="gvl-msg"></div>' +
      '<div class="foot"><span class="note">The progress travels inside the link. Nothing is uploaded or stored on a server.</span><button id="gvl-close">Done</button></div>');
    dlg.appendChild(box);
    box.querySelector(".sum").textContent = "This browser: " + summary(d);
    if(typeof account !== "undefined" && account.configured){
      var tip = document.createElement("p");
      tip.style.cssText = "color:#fbbf24;margin:-4px 0 12px";
      tip.textContent = account.user ? "You're signed in as " + account.user.login + ", so this syncs automatically. The link is only needed for a browser where you won't sign in."
        : "Easier: sign in with GitHub (top right) and your progress syncs to every device by itself.";
      box.querySelector(".sum").after(tip);
    }
    var link = linkFor(d), inp = box.querySelector("#gvl-link"), msg = box.querySelector("#gvl-msg");
    inp.value = link;
    inp.onfocus = function(){ inp.select(); };
    box.querySelector("#gvl-copy").onclick = function(){
      var b = this;
      function ok(){ b.textContent = "Copied ✓"; setTimeout(function(){ b.textContent = "Copy"; }, 1500); }
      if(navigator.clipboard) navigator.clipboard.writeText(link).then(ok, function(){ inp.select(); document.execCommand("copy"); ok(); });
      else { inp.select(); document.execCommand("copy"); ok(); }
    };
    box.querySelector("#gvl-import").onclick = function(){
      var v = box.querySelector("#gvl-paste").value.trim(), code = v.indexOf("#import=") >= 0 ? v.split("#import=")[1] : v;
      try{ var inc = decode(code); }catch(e){ msg.className = "msg err"; msg.textContent = "That doesn't look like a progress link. Copy the whole link and try again."; return; }
      try{ merge(inc); }catch(e){ msg.className = "msg err"; msg.textContent = "This browser is blocking saved data (private mode?), so progress can't be stored here."; return; }
      msg.className = "msg ok"; msg.textContent = "Imported: " + summary(inc) + ". Reloading…";
      setTimeout(function(){ location.reload(); }, 900);
    };
    box.querySelector("#gvl-close").onclick = function(){ dlg.close(); };
    show(dlg);
  }

  function offerImport(code){
    var inc;
    try{ inc = decode(code); }catch(e){ clearHash(); return; }
    var dlg = dialog(); dlg.innerHTML = "";
    var box = el(
      "<h2>Bring your progress into this browser?</h2>" +
      "<p>This link carries progress from another device:</p>" +
      '<div class="sum"></div>' +
      "<p>It will be added to anything already done here. Nothing is removed.</p>" +
      '<div class="msg" id="gvl-msg"></div>' +
      '<div class="foot"><button id="gvl-no">Not now</button><button class="go" id="gvl-yes">Import progress</button></div>');
    dlg.appendChild(box);
    box.querySelector(".sum").textContent = summary(inc);
    box.querySelector("#gvl-no").onclick = function(){ clearHash(); dlg.close(); };
    box.querySelector("#gvl-yes").onclick = function(){
      var msg = box.querySelector("#gvl-msg");
      try{ merge(inc); }catch(e){ msg.className = "msg err"; msg.textContent = "This browser is blocking saved data (private mode?), so progress can't be stored here."; return; }
      clearHash(); location.reload();
    };
    show(dlg);
  }
  function clearHash(){ try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){ location.hash = ""; } }
  function show(dlg){ if(dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }

  document.addEventListener("click", function(e){
    var t = e.target.closest && e.target.closest("[data-sync]");
    if(t){ e.preventDefault(); openSync(); }
  });
  function boot(){
    var m = location.hash.match(/^#import=([A-Za-z0-9_-]+)$/);
    if(m) offerImport(m[1]);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  // pasting the link into a tab already on this site changes only the #fragment
  window.addEventListener("hashchange", boot);
  // ================================================================ account sync
  // Optional: when the site has GitHub sign-in set up, signed-in learners get
  // their progress saved to their account and pulled into every browser.
  var account = {configured:false, user:null}, pushed = null, pushing = false;
  var GH = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style="vertical-align:-2px"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

  var acctCss = ".gvl-acct{display:inline-flex;align-items:center;gap:8px;font:12px ui-monospace,Menlo,monospace;color:#94a3b8;white-space:nowrap}" +
    ".gvl-acct a,.gvl-acct button{color:#94a3b8;text-decoration:none;background:none;border:0;padding:0;font:inherit;cursor:pointer}" +
    ".gvl-acct a:hover,.gvl-acct button:hover{color:#e2e8f0}" +
    ".gvl-acct .in{border:1px solid rgba(56,189,248,.35);border-radius:999px;padding:4px 12px;color:#e2e8f0}" +
    ".gvl-acct .in:hover{border-color:#38bdf8}" +
    ".gvl-acct img{width:22px;height:22px;border-radius:50%;border:1px solid rgba(56,189,248,.35)}" +
    ".gvl-acct .st{color:#34d399}.gvl-acct .st.err{color:#fb7185}" +
    "@media (max-width:600px){.gvl-acct .who,.gvl-acct .st{display:none}}";

  function api(path, opts){
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({"content-type":"application/json"}, opts.headers || {});
    return fetch("/api/" + path, opts).then(function(r){
      if(r.status === 401) return null;
      if(!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }
  function setStatus(text, err){
    document.querySelectorAll(".gvl-acct .st").forEach(function(s){ s.textContent = text; s.classList.toggle("err", !!err); });
  }
  function renderAccount(){
    var slots = document.querySelectorAll("[data-account]");
    if(!slots.length) return;
    if(!document.getElementById("gvl-acct-css")){ var st = document.createElement("style"); st.id = "gvl-acct-css"; st.textContent = acctCss; document.head.appendChild(st); }
    slots.forEach(function(slot){
      slot.innerHTML = "";
      if(!account.configured) return;
      var box = document.createElement("span"); box.className = "gvl-acct";
      if(!account.user){
        var a = document.createElement("a"); a.className = "in";
        a.href = "/api/login?return=" + encodeURIComponent(location.pathname + location.search);
        a.innerHTML = GH + " Sign in to sync";
        a.title = "Sign in with GitHub to keep your progress on every device";
        box.appendChild(a);
      } else {
        var img = document.createElement("img"); img.alt = ""; img.src = account.user.avatar + (account.user.avatar.indexOf("?") > 0 ? "&" : "?") + "s=44";
        var who = document.createElement("span"); who.className = "who"; who.textContent = account.user.login;
        var s = document.createElement("span"); s.className = "st"; s.textContent = "syncing…";
        var out = document.createElement("button"); out.textContent = "Sign out"; out.setAttribute("data-signout", "");
        box.appendChild(img); box.appendChild(who); box.appendChild(s); box.appendChild(out);
      }
      slot.appendChild(box);
    });
  }

  // pull from the account; the account fills in what this browser lacks
  function applyServer(server){
    var ls = store(); if(!ls) return false;
    var changed = false;
    Object.keys(server).forEach(function(k){
      var cur = get(k, null), inc = server[k], next;
      if(k === "done" || k === "pg"){
        next = cur && typeof cur === "object" ? Object.assign({}, cur) : {};
        for(var x in inc) if(inc[x] && !next[x]){ next[x] = true; changed = true; }
      } else if(k.indexOf("score:") === 0){
        next = cur && typeof cur === "object" ? Object.assign({}, cur) : {};
        for(var y in inc) if(!(y in next)){ next[y] = inc[y]; changed = true; }
      } else if(k === "last"){
        if(cur !== null) return;
        next = inc; changed = true;
      } else return;
      ls.setItem(PREFIX + k, JSON.stringify(next));
    });
    return changed;
  }
  function push(keepalive){
    if(!account.user || pushing) return;
    var snap = JSON.stringify(collect());
    if(snap === pushed) return;
    pushing = true;
    var d = collect(); delete d["pg:hist"];
    api("progress", {method:"PUT", body:JSON.stringify({d:d}), keepalive:!!keepalive}).then(function(r){
      pushing = false;
      if(r === null){ account.user = null; renderAccount(); return; }
      pushed = snap; setStatus("synced ✓");
    }, function(){ pushing = false; setStatus("offline · will retry", true); });
  }
  function startSync(){
    api("progress").then(function(r){
      if(r === null){ account.user = null; renderAccount(); return; }
      var changed = applyServer(r.d || {});
      push();
      var flag = "gvl:pulled";
      var already = false; try{ already = sessionStorage.getItem(flag) === "1"; }catch(e){}
      if(changed && !already){
        try{ sessionStorage.setItem(flag, "1"); }catch(e){}
        setTimeout(function(){ location.reload(); }, 250);   // redraw with the merged progress
        return;
      }
      try{ sessionStorage.removeItem(flag); }catch(e){}
      setStatus("synced ✓");
      setInterval(function(){ push(); }, 4000);
      addEventListener("pagehide", function(){ push(true); });
      document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "hidden") push(true); });
    }, function(){ setStatus("offline", true); });
  }
  function noticeFromUrl(){
    var m = location.search.match(/[?&]signin=(ok|failed)/);
    if(!m) return;
    var clean = location.pathname + location.search.replace(/([?&])signin=(ok|failed)&?/, "$1").replace(/[?&]$/, "") + location.hash;
    try{ history.replaceState(null, "", clean); }catch(e){}
    if(m[1] === "failed") setTimeout(function(){ alert("GitHub sign-in didn't complete. Please try again."); }, 50);
  }
  function bootAccount(){
    if(!/^https?:$/.test(location.protocol)) return;
    noticeFromUrl();
    api("me").then(function(r){
      if(!r) return;
      account.configured = !!r.configured; account.user = r.user;
      renderAccount();
      if(account.user) startSync();
    }, function(){ /* no API here (e.g. a plain static server): sign-in stays hidden */ });
  }
  document.addEventListener("click", function(e){
    var t = e.target.closest && e.target.closest("[data-signout]");
    if(!t) return;
    e.preventDefault();
    push(true);
    fetch("/api/logout", {method:"POST", credentials:"same-origin"}).then(function(){ location.reload(); });
  });
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootAccount); else bootAccount();

  window.gvlProgress = {collect:collect, encode:encode, decode:decode, merge:merge, open:openSync, account:function(){ return account; }};
})();
