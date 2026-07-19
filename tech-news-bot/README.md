# Automated Tech News Instagram Generator

This bot runs four times per day using GitHub Actions. It reads recent items from configured RSS feeds, summarizes each story, creates a 1080×1080 PNG, writes a post-ready caption, and stores the latest posts in `tech-news-bot/output/`.

## One-time setup

1. Open Google AI Studio and create a Gemini API key.
2. In this GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `GEMINI_API_KEY` and paste the key.
4. Open **Actions → Generate Tech News Posts → Run workflow** to test it.
5. Review the generated PNG and TXT files in `tech-news-bot/output/`.

The bot still works without a Gemini key, but it uses a basic extractive summary instead of an AI-written summary.

## Customize

Edit `config.json` to change:

- brand name and tagline
- number of posts generated per run
- news websites/RSS feeds

Edit colors, typography, spacing, and layout in `make_poster()` inside `bot.py`.

## Instagram publishing

The current workflow creates post-ready files but does not publish directly to Instagram. Automatic publishing requires an Instagram Professional account connected to a Facebook Page, a Meta app, an access token, the Instagram account ID, and a publicly reachable image URL. Add direct publishing only after reviewing the generated output and securing those credentials as GitHub Secrets.

## Copyright and attribution

The generated graphic includes the source publication name, and each caption includes the original article URL. Keep summaries factual and do not copy full article text or remove source attribution.
