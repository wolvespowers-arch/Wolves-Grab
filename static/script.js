const $ = id => document.getElementById(id);
const msg = (t, e) => { $("msg").textContent = t; $("msg").className = e ? "err" : ""; };
const fmt = s => s ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : "";
const getUrl = () => ($("url").value.match(/https?:\/\/\S+/) || [""])[0];
const OFFLINE = "You're offline. Connect to the internet to find a video.";
const KEY = "wg-history";
let current = null;

const loadH = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const saveH = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };

function renderH() {
  const l = loadH();
  $("history").style.display = l.length ? "block" : "none";
  const ul = $("hlist");
  ul.innerHTML = "";
  l.forEach(x => {
    const li = document.createElement("li");
    const t = document.createElement("span");
    t.className = "t";
    t.textContent = x.title || x.url;
    const b = document.createElement("button");
    b.textContent = "Open";
    b.onclick = () => {
      $("url").value = x.url;
      window.scrollTo({ top: 0, behavior: "smooth" });
      $("go").click();
    };
    li.append(t, b);
    ul.append(li);
  });
}

function addHistory() {
  if (!current || current.url !== getUrl()) return;
  const l = loadH().filter(x => x.url !== current.url);
  l.unshift({ title: current.title, url: current.url });
  saveH(l.slice(0, 10));
  renderH();
}

$("go").onclick = async () => {
  const url = getUrl();
  if (!url) { msg("Paste a video link first.", true); return; }
  if (!navigator.onLine) { msg(OFFLINE, true); return; }
  $("result").style.display = "none";
  $("go").disabled = true;
  msg("Looking up your video...");
  try {
    const r = await fetch("/api/info?url=" + encodeURIComponent(url));
    const d = await r.json();
    if (!r.ok) { msg(d.error, true); return; }
    current = { title: d.title, url: url };
    $("thumb").src = d.thumbnail || "";
    $("thumb").style.display = d.thumbnail ? "block" : "none";
    $("title").textContent = d.title || "Untitled";
    $("meta").textContent = [d.uploader, fmt(d.duration)].filter(Boolean).join(" • ");
    $("result").style.display = "block";
    msg("");
  } catch (e) {
    msg(navigator.onLine ? "Could not reach the server. Try again." : OFFLINE, true);
  } finally {
    $("go").disabled = false;
  }
};

const dl = kind => {
  if (!navigator.onLine) { msg(OFFLINE, true); return; }
  addHistory();
  msg("Preparing your file. This can take a moment...");
  window.location = "/api/download?kind=" + kind + "&url=" + encodeURIComponent(getUrl());
  setTimeout(() => msg(""), 6000);
};

$("dlv").onclick = () => dl("video");
$("dla").onclick = () => dl("audio");
$("hclear").onclick = () => { saveH([]); renderH(); };
$("url").addEventListener("keydown", e => { if (e.key === "Enter") $("go").click(); });
window.addEventListener("offline", () => msg(OFFLINE, true));
window.addEventListener("online", () => msg(""));

function handleShare() {
  const p = new URLSearchParams(location.search);
  const raw = [p.get("url"), p.get("text"), p.get("title")].filter(Boolean).join(" ");
  const m = raw.match(/https?:\/\/\S+/);
  if (!m) return;
  $("url").value = m[0];
  history.replaceState(null, "", location.pathname);
  if (navigator.onLine) $("go").click();
}

renderH();
handleShare();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
        }
const root = document.documentElement;
const savedTheme = () => { try { return localStorage.getItem("wg-theme"); } catch (e) { return null; } };
function applyTheme(t) {
  root.setAttribute("data-theme", t);
  $("theme").textContent = t === "dark" ? "☀ Light" : "☾ Dark";
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", t === "dark" ? "#0e1b19" : "#143530");
}
applyTheme(savedTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("theme").onclick = () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  try { localStorage.setItem("wg-theme", next); } catch (e) {}
  applyTheme(next);
};
