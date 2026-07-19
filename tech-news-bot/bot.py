from __future__ import annotations

import hashlib
import html
import io
import json
import os
import re
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import feedparser
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
STATE_FILE = ROOT / "state.json"
CONFIG_FILE = ROOT / "config.json"
USER_AGENT = "TechNewsPosterBot/1.0 (+GitHub Actions)"


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def clean_text(value: str) -> str:
    soup = BeautifulSoup(html.unescape(value or ""), "html.parser")
    return re.sub(r"\s+", " ", soup.get_text(" ")).strip()


def article_image(entry: Any) -> str | None:
    for key in ("media_content", "media_thumbnail"):
        for item in entry.get(key, []) or []:
            url = item.get("url")
            if url:
                return url
    for link in entry.get("links", []) or []:
        if str(link.get("type", "")).startswith("image/"):
            return link.get("href")
    soup = BeautifulSoup(entry.get("summary", ""), "html.parser")
    image = soup.find("img")
    return image.get("src") if image else None


def collect_articles(config: dict[str, Any], seen: set[str]) -> list[dict[str, Any]]:
    articles: list[dict[str, Any]] = []
    for source in config["feeds"]:
        feed = feedparser.parse(source["url"], agent=USER_AGENT)
        for entry in feed.entries[:12]:
            link = entry.get("link", "").strip()
            title = clean_text(entry.get("title", ""))
            if not link or not title:
                continue
            key = hashlib.sha256(link.encode()).hexdigest()[:20]
            if key in seen:
                continue
            published = entry.get("published_parsed") or entry.get("updated_parsed")
            timestamp = datetime(*published[:6], tzinfo=timezone.utc).timestamp() if published else 0
            articles.append({
                "id": key,
                "title": title,
                "description": clean_text(entry.get("summary", ""))[:1800],
                "url": link,
                "source": source["name"],
                "image": article_image(entry),
                "timestamp": timestamp,
            })
    articles.sort(key=lambda x: x["timestamp"], reverse=True)
    return articles


def fallback_summary(article: dict[str, Any]) -> dict[str, Any]:
    words = article["description"].split()
    summary = " ".join(words[:38]).rstrip(".,")
    if summary:
        summary += "."
    else:
        summary = article["title"]
    return {
        "headline": article["title"][:90],
        "summary": summary[:240],
        "caption": f"{article['title']}\n\n{summary}\n\nSource: {article['source']}\n{article['url']}",
        "hashtags": ["#TechNews", "#Technology", "#Innovation", "#AI"],
    }


def summarize(article: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return fallback_summary(article)

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    prompt = f"""Create an accurate Instagram tech-news post from the supplied article metadata.
Do not invent facts. Keep the image headline under 75 characters and the image summary under 180 characters.
Return ONLY valid JSON with keys: headline, summary, caption, hashtags.
hashtags must be an array of 5 to 8 relevant hashtags.

Source: {article['source']}
Title: {article['title']}
Description: {article['description']}
URL: {article['url']}
"""
    try:
        response = requests.post(
            endpoint,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
            },
            timeout=45,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
        if not all(k in data for k in ("headline", "summary", "caption", "hashtags")):
            raise ValueError("Incomplete model response")
        return data
    except Exception as exc:
        print(f"Gemini summary failed; using fallback: {exc}")
        return fallback_summary(article)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def download_image(url: str | None) -> Image.Image | None:
    if not url:
        return None
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=25)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:
        print(f"Image download failed: {exc}")
        return None


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    ratio = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((int(image.width * ratio), int(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def wrap_by_width(draw: ImageDraw.ImageDraw, text: str, used_font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.splitlines() or [text]:
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=used_font)[2] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def draw_multiline(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, used_font: ImageFont.ImageFont,
                   max_width: int, fill: str, spacing: int, max_lines: int) -> int:
    lines = wrap_by_width(draw, text, used_font, max_width)[:max_lines]
    if len(wrap_by_width(draw, text, used_font, max_width)) > max_lines and lines:
        lines[-1] = lines[-1].rstrip("., ") + "…"
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=used_font, fill=fill)
        box = draw.textbbox((x, y), line, font=used_font)
        y = box[3] + spacing
    return y


def make_poster(article: dict[str, Any], copy: dict[str, Any], config: dict[str, Any], destination: Path) -> None:
    canvas = Image.new("RGB", (1080, 1080), "#07111f")
    source = download_image(article.get("image"))
    if source:
        background = cover(source, (1080, 1080)).filter(ImageFilter.GaussianBlur(1.5))
        background = ImageEnhance.Brightness(background).enhance(0.55)
        canvas.paste(background)
    else:
        draw = ImageDraw.Draw(canvas)
        for y in range(1080):
            draw.line((0, y, 1080, y), fill=(7 + y // 90, 17 + y // 45, 31 + y // 24))

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 1080, 1080), fill=(2, 8, 18, 80))
    od.rounded_rectangle((55, 52, 1025, 1028), radius=34, fill=(4, 12, 25, 205), outline=(255, 255, 255, 35), width=2)
    od.rounded_rectangle((82, 80, 365, 138), radius=20, fill=(38, 223, 187, 255))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(canvas)

    draw.text((108, 92), config["tagline"], font=font(25, True), fill="#04111d")
    draw.text((82, 178), config["brand_name"], font=font(35, True), fill="#26dfbb")
    draw.text((82, 235), article["source"].upper(), font=font(24, True), fill="#aab9cb")

    y = draw_multiline(draw, (82, 300), str(copy["headline"]), font(62, True), 910, "#ffffff", 12, 5)
    y += 30
    draw.rounded_rectangle((82, y, 998, y + 5), radius=3, fill="#26dfbb")
    y += 42
    draw_multiline(draw, (82, y), str(copy["summary"]), font(33), 900, "#d9e3ee", 14, 5)

    draw.text((82, 958), datetime.now(timezone.utc).strftime("%d %b %Y"), font=font(23, True), fill="#90a4b8")
    draw.text((998, 958), "SWIPE / READ CAPTION", anchor="ra", font=font(23, True), fill="#26dfbb")
    canvas.convert("RGB").save(destination, "PNG", optimize=True)


def write_index(records: list[dict[str, Any]]) -> None:
    cards = []
    for item in records:
        tags = " ".join(item["hashtags"])
        cards.append(f"""
<article class="card">
  <img src="{item['image_file']}" alt="{html.escape(item['headline'])}">
  <div><h2>{html.escape(item['headline'])}</h2><p>{html.escape(item['caption'])}</p>
  <p class="tags">{html.escape(tags)}</p><a href="{html.escape(item['url'])}">Original source</a></div>
</article>""")
    page = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tech News Posts</title><style>body{{font-family:Arial;background:#07111f;color:#fff;margin:0;padding:24px}}main{{max-width:1100px;margin:auto}}.card{{display:grid;grid-template-columns:minmax(260px,480px) 1fr;gap:24px;background:#101d2d;padding:18px;border-radius:20px;margin:22px 0}}img{{width:100%;border-radius:14px}}p{{white-space:pre-wrap;line-height:1.5;color:#d9e3ee}}a,.tags{{color:#26dfbb}}@media(max-width:750px){{.card{{grid-template-columns:1fr}}}}</style></head>
<body><main><h1>Generated Tech News Posts</h1>{''.join(cards)}</main></body></html>"""
    (OUTPUT / "index.html").write_text(page, encoding="utf-8")


def main() -> None:
    config = load_json(CONFIG_FILE, {})
    state = load_json(STATE_FILE, {"seen": [], "posts": []})
    seen = set(state.get("seen", []))
    OUTPUT.mkdir(exist_ok=True)

    candidates = collect_articles(config, seen)
    selected = candidates[: int(config.get("posts_per_run", 3))]
    if not selected:
        print("No new articles found.")
        write_index(state.get("posts", []))
        return

    new_records = []
    for article in selected:
        copy = summarize(article)
        filename = f"{datetime.now(timezone.utc):%Y%m%d}-{article['id']}.png"
        make_poster(article, copy, config, OUTPUT / filename)
        caption = str(copy["caption"]).strip()
        record = {
            "id": article["id"], "headline": copy["headline"], "caption": caption,
            "hashtags": copy["hashtags"], "url": article["url"], "source": article["source"],
            "image_file": filename, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        (OUTPUT / f"{article['id']}.txt").write_text(caption + "\n\n" + " ".join(copy["hashtags"]), encoding="utf-8")
        new_records.append(record)
        seen.add(article["id"])

    posts = (new_records + state.get("posts", []))[:30]
    save_json(STATE_FILE, {"seen": list(seen)[-500:], "posts": posts})
    save_json(OUTPUT / "posts.json", posts)
    write_index(posts)
    print(f"Generated {len(new_records)} post(s).")


if __name__ == "__main__":
    main()
