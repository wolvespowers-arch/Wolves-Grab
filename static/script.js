const $ = id => document.getElementById(id);
const msg = (t, e) => { $("msg").textContent = t; $("msg").className = e ? "err" : ""; if (!e) $("report").hidden = true; };
const fmt = s => s ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : "";
const getUrl = () => ($("url").value.match(/https?:\/\/\S+/) || [""])[0];
const OFFLINE = "You're offline. Connect to the internet to find a video.";
const KEY = "wg-history";
let current = null;

const WAKE = [
  "The server is starting up. The first request can take up to a minute.",
  "Still starting. Thank you for your patience.",
  "Almost ready. Your request is being processed.",
  "The server is warming up. Your video will load shortly."
];

function fail(text, url) {
  msg(text, true);
  const body = "Link: " + (url || "") + "\nProblem: " + text + "\nBrowser: " + navigator.userAgent;
  $("report").href = "mailto:wolvespowers@gmail.com?subject=" + encodeURIComponent("Wolves Grab problem") + "&body=" + encodeURIComponent(body);
  $("report").hidden = false;
}

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
  let wi = 0;
  const wake = setInterval(() => { msg(WAKE[wi % WAKE.length]); wi++; }, 6000);
  try {
    const r = await fetch("/api/info?url=" + encodeURIComponent(url));
    clearInterval(wake);
    const d = await r.json();
    if (!r.ok) { fail(d.error, url); return; }
    current = { title: d.title, url: url };
    $("thumb").src = d.thumbnail || "";
    $("thumb").style.display = d.thumbnail ? "block" : "none";
    $("title").textContent = d.title || "Untitled";
    $("meta").textContent = [d.uploader, fmt(d.duration)].filter(Boolean).join(" • ");
    $("result").style.display = "block";
    msg("");
  } catch (e) {
    clearInterval(wake);
    if (navigator.onLine) fail("Could not reach the server. Try again.", url);
    else msg(OFFLINE, true);
  } finally {
    clearInterval(wake);
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

$("paste").onclick = async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (!/https?:\/\//.test(t)) { msg("No link found in your clipboard. Copy a video link first.", true); return; }
    $("url").value = t;
    $("go").click();
  } catch (e) {
    msg("Couldn't read the clipboard. Long-press the box and tap Paste.", true);
    $("url").focus();
  }
};

$("share").onclick = async () => {
  const data = { title: "Wolves Grab", text: "Free video downloader for TikTok and Instagram.", url: location.origin };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(location.origin); msg("Link copied. Send it to your friends."); }
  } catch (e) {}
};

function handleShare() {
  const p = new URLSearchParams(location.search);
  const raw = [p.get("url"), p.get("text"), p.get("title")].filter(Boolean).join(" ");
  const m = raw.match(/https?:\/\/\S+/);
  if (!m) return;
  $("url").value = m[0];
  history.replaceState(null, "", location.pathname);
  if (navigator.onLine) $("go").click();
}

let installEvt = null;
const installBtn = $("install");
const isInstalled = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (!isInstalled()) installBtn.hidden = false;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
installBtn.onclick = async () => {
  if (installEvt) {
    installEvt.prompt();
    await installEvt.userChoice;
    installEvt = null;
  } else {
    msg("To install: tap the ⋮ menu in Chrome, then tap Add to Home screen. On iPhone, tap Share, then Add to Home Screen.");
  }
};
window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  msg("Installed! Open Wolves Grab from your home screen.");
});

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

renderH();
handleShare();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
    }
