const $ = id => document.getElementById(id);
const msg = (t, e) => { $("msg").textContent = t; $("msg").className = e ? "err" : ""; };
const fmt = s => s ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : "";
const getUrl = () => ($("url").value.match(/https?:\/\/\S+/) || [""])[0];
const OFFLINE = "You're offline. Connect to the internet to find a video.";

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
  msg("Preparing your file. This can take a moment...");
  window.location = "/api/download?kind=" + kind + "&url=" + encodeURIComponent(getUrl());
  setTimeout(() => msg(""), 6000);
};

$("dlv").onclick = () => dl("video");
$("dla").onclick = () => dl("audio");
$("url").addEventListener("keydown", e => { if (e.key === "Enter") $("go").click(); });

window.addEventListener("offline", () => msg(OFFLINE, true));
window.addEventListener("online", () => msg(""));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
