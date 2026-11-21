# Wolves Grab

Drop the link. Take the video.

Wolves Grab is a small website that saves a video, or only its audio, from a public link. It works with YouTube, TikTok, Instagram, Facebook, X and many other sites.

Only save videos you own or have permission to use.

## How it works

You paste a link into the page. The page asks the Python back end to read the link. The back end uses yt-dlp to find the video, then sends the file back to you.

## Files

- `app.py`: the back end, built with Flask and yt-dlp
- `static/index.html`: the page
- `static/style.css`: the look of the page
- `static/script.js`: what the page does when you tap a button
- `requirements.txt`: the Python packages to install
- `Procfile`: the start command for the host

## Run it on a computer

```
pip install -r requirements.txt
python app.py
```

Then open http://localhost:5000

## Put it online

1. Create a Web Service on Render or Railway from this repository.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app --timeout 300`
4. Open the link the host gives you.

Some free hosts block downloader tools. If downloads fail there, try another host.
