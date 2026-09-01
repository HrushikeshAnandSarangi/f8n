"""Ported from the original Django `sentiment` app (sentiment/views.py + text_clean.py).

Same data sources and model as before - Reddit via praw, Yahoo Finance news via
newspaper3k, and the financial-tuned HuggingFace sentiment classifier - just reused as
the `source.sentiment` block's data source instead of a standalone Django endpoint.

Heavy imports (transformers/torch, praw) are deferred into the functions that need
them so importing this module (and the app as a whole) doesn't require them to be
installed unless the sentiment block is actually exercised.
"""

import logging
import os

import pandas as pd

from .text_clean import clean_text

logger = logging.getLogger(__name__)

DEFAULT_SUBREDDITS = ["CryptoCurrency", "CryptoMarkets", "Bitcoin"]

_pipeline = None
_reddit_client = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline

        _pipeline = pipeline(
            "text-classification",
            model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis",
        )
    return _pipeline


def _get_reddit_client():
    global _reddit_client
    if _reddit_client is None:
        import praw

        _reddit_client = praw.Reddit(
            client_id=os.environ.get("REDDIT_CLIENT_ID"),
            client_secret=os.environ.get("REDDIT_CLIENT_SECRET"),
            user_agent=os.environ.get("REDDIT_USER_AGENT", "f8n-agent/1.0"),
        )
    return _reddit_client


def fetch_posts(subreddit_names, ticker, limit=20):
    reddit = _get_reddit_client()
    posts, seen_ids = [], set()
    for name in subreddit_names:
        try:
            subreddit = reddit.subreddit(name)
            for submission in subreddit.new(limit=limit * 2):
                haystack = f"{submission.title} {submission.selftext}".upper()
                if ticker.upper() in haystack and submission.id not in seen_ids:
                    posts.append({"title": submission.title, "selftext": submission.selftext})
                    seen_ids.add(submission.id)
                if len(posts) >= limit:
                    return posts
        except Exception as exc:  # noqa: BLE001 - a bad subreddit/network hiccup shouldn't kill the run
            logger.warning("Error fetching posts from r/%s: %s", name, exc)
    return posts[:limit]


def fetch_news(ticker, limit=10):
    import yfinance as yf
    from newspaper import Article

    articles = []
    try:
        news_data = yf.Ticker(ticker).news or []
        for info in news_data[:limit]:
            link = info.get("link")
            if not link:
                continue
            try:
                article = Article(link)
                article.download()
                article.parse()
                articles.append(article.text[:300])
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to process article %s: %s", link, exc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Error fetching news for %s: %s", ticker, exc)
    return articles


def analyze_sentiments(texts):
    cleaned = [clean_text(t[:300]) for t in texts if t and isinstance(t, str)]
    if not cleaned:
        return pd.DataFrame({"text": [], "sentiment": [], "score": []})

    pipe = _get_pipeline()
    try:
        results = [pipe(t)[0] for t in cleaned]
        return pd.DataFrame(
            {
                "text": cleaned,
                "sentiment": [r["label"] for r in results],
                "score": [r["score"] for r in results],
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Error analyzing sentiment: %s", exc)
        return pd.DataFrame({"text": cleaned, "sentiment": ["neutral"] * len(cleaned), "score": [0.5] * len(cleaned)})


def _percentages(df):
    if df.empty:
        return {"positive": 0.0, "negative": 0.0, "neutral": 100.0}
    counts = df["sentiment"].str.lower().value_counts(normalize=True) * 100
    return {
        "positive": round(float(counts.get("positive", 0.0)), 2),
        "negative": round(float(counts.get("negative", 0.0)), 2),
        "neutral": round(float(counts.get("neutral", 0.0)), 2),
    }


def fetch_sentiment(ticker, subreddits=None, limit=20):
    """Returns {"reddit": {"positive","negative","neutral"}, "news": {...}} for a ticker."""
    subreddits = subreddits or DEFAULT_SUBREDDITS

    reddit_posts = fetch_posts(subreddits, ticker, limit=limit)
    reddit_texts = [f"Title: {p['title']} Body: {clean_text(p['selftext'])}" for p in reddit_posts]
    news_texts = fetch_news(ticker)

    return {
        "reddit": _percentages(analyze_sentiments(reddit_texts)),
        "news": _percentages(analyze_sentiments(news_texts)),
    }
