import os, shutil, tempfile
from flask import Flask, request, jsonify, send_file, after_this_request
import yt_dlp

app = Flask(__name__, static_folder="static", static_url_path="")

@app.get("/")
def home():
    return app.send_static_file("index.html")

@app.get("/api/info")
def info():
    url = request.args.get("url", "").strip()
    if not url.startswith(("http://", "https://")):
        return jsonify(error="Paste a full link starting with http:// or https://"), 400
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "noplaylist": True}) as ydl:
            d = ydl.extract_info(url, download=False)
        return jsonify(title=d.get("title"), thumbnail=d.get("thumbnail"),
                       duration=d.get("duration"), uploader=d.get("uploader"))
    except Exception:
        return jsonify(error="Could not read that link. Check it is public and try again."), 400

@app.get("/api/download")
def download():
    url = request.args.get("url", "").strip()
    kind = request.args.get("kind", "video")
    if not url.startswith(("http://", "https://")):
        return jsonify(error="Invalid link"), 400
    tmp = tempfile.mkdtemp()
    opts = {"quiet": True, "noplaylist": True,
            "outtmpl": os.path.join(tmp, "%(title).80s.%(ext)s")}
    if kind == "audio":
        opts["format"] = "bestaudio[ext=m4a]/bestaudio"
    else:
        opts["format"] = "best[ext=mp4]/best"
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
        path = os.path.join(tmp, os.listdir(tmp)[0])
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        return jsonify(error="Download failed. The site may block this video."), 400

    @after_this_request
    def cleanup(resp):
        shutil.rmtree(tmp, ignore_errors=True)
        return resp
    return send_file(path, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
