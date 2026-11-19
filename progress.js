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
  window.gvlProgress = {collect:collect, encode:encode, decode:decode, merge:merge, open:openSync};
})();
