const $ = id => document.getElementById(id);
const msg = (t, e) => { $("msg").textContent = t; $("msg").className = e ? "err" : ""; };
const fmt = s => s ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : "";
const getUrl = () => ($("url").value.match(/https?:\/\/\S+/) || [""])[0];

$("go").onclick = async () => {
  const url = getUrl();
  if (!url) { msg("Paste a video link first.", true); return; }
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
    msg("Could not reach the server. Try again.", true);
  } finally {
    $("go").disabled = false;
  }
};

const dl = kind => {
  msg("Preparing your file. This can take a moment...");
  window.location = "/api/download?kind=" + kind + "&url=" + encodeURIComponent(getUrl());
  setTimeout(() => msg(""), 6000);
};

$("dlv").onclick = () => dl("video");
$("dla").onclick = () => dl("audio");
$("url").addEventListener("keydown", e => { if (e.key === "Enter") $("go").click(); });
