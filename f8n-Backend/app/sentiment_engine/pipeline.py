"""Lightweight sentiment pipeline for the `source.sentiment` block.

Originally this ran a HuggingFace financial-news transformer model (`torch` +
`transformers`), which meant a multi-GB Docker image and a slow cold start just to
classify a couple of dozen short posts/headlines. It's replaced here with
**VADER** (`vaderSentiment` - pure Python, no ML framework, no GPU) with a small
finance/crypto lexicon layered on top, since general-purpose VADER under/over-reacts
to domain words like "bullish", "rug pull", or "rekt". This is orders of magnitude
lighter and faster, at the cost of some nuance a fine-tuned transformer would catch -
a reasonable trade for a free tool that needs to actually be cheap to run.

News is pluggable across multiple free sources, each independently toggleable via the
block's config (see app/blocks/sources.py):
  - Reddit (praw)                - needs a free Reddit "script" app (REDDIT_CLIENT_ID/SECRET)
  - RSS headlines (feedparser)   - CoinDesk + Cointelegraph, no key ever required
  - CryptoPanic                  - needs a free API key (CRYPTOPANIC_API_KEY)
  - Yahoo Finance headlines      - via yfinance, no key required

Heavy/optional imports are deferred into the functions that need them so importing
this module doesn't require any of them to be installed unless actually exercised.
"""

import logging
import os

import pandas as pd
import requests

from .text_clean import clean_text

logger = logging.getLogger(__name__)

DEFAULT_SUBREDDITS = ["CryptoCurrency", "CryptoMarkets", "Bitcoin"]

DEFAULT_RSS_FEEDS = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
]

# Maps a base ticker symbol to the words worth matching against in RSS headlines,
# since crypto news feeds aren't structured/queryable by ticker the way an API is.
TICKER_ALIASES = {
    "BTC": ["btc", "bitcoin"],
    "ETH": ["eth", "ethereum", "ether"],
    "SOL": ["sol", "solana"],
    "XRP": ["xrp", "ripple"],
    "ADA": ["ada", "cardano"],
    "DOGE": ["doge", "dogecoin"],
    "DOT": ["dot", "polkadot"],
    "AVAX": ["avax", "avalanche"],
    "MATIC": ["matic", "polygon"],
    "LTC": ["ltc", "litecoin"],
    "BNB": ["bnb", "binance coin"],
}

DEFAULT_SOURCES = {
    "reddit": True,
    "rss_news": True,
    "cryptopanic": False,
    "yahoo_finance": False,
}

# A small Loughran-McDonald-style finance/crypto lexicon layered on VADER's
# general-purpose one. VADER alone barely reacts to words like "bullish" or
# "rug pull" - these push short social/news snippets in the right direction for
# this domain. Values are on VADER's -4..+4 intensity scale.
FINANCE_LEXICON = {
    "bullish": 2.5, "bearish": -2.5, "rally": 1.8, "rallying": 1.8, "surge": 2.0,
    "surging": 2.0, "soar": 2.2, "soaring": 2.2, "moon": 2.0, "mooning": 2.2,
    "plunge": -2.5, "plunging": -2.5, "crash": -3.0, "crashing": -3.0,
    "collapse": -2.8, "collapsing": -2.8, "selloff": -1.8, "sell-off": -1.8,
    "correction": -1.0, "dump": -2.0, "dumping": -2.0, "pump": 1.3,
    "rekt": -2.5, "rug pull": -3.0, "rugpull": -3.0, "hack": -2.5, "hacked": -2.5,
    "exploit": -2.0, "exploited": -2.0, "breach": -2.0, "breached": -2.0,
    "bankruptcy": -3.0, "insolvent": -2.8, "insolvency": -2.8, "default": -2.0,
    "adoption": 1.5, "partnership": 1.2, "upgrade": 1.2, "outperform": 1.8,
    "underperform": -1.8, "downgrade": -1.8, "ban": -2.2, "banned": -2.2,
    "lawsuit": -1.8, "sued": -1.5, "fraud": -2.8, "scam": -2.8, "ponzi": -3.0,
    "profit": 1.5, "profitable": 1.5, "profits": 1.5, "loss": -1.5, "losses": -1.5,
    "all-time high": 2.5, "ath": 1.5, "all-time low": -2.5, "atl": -1.5,
    "resilient": 1.2, "liquidation": -2.0, "liquidated": -2.0, "liquidations": -2.0,
    "short squeeze": 1.5, "bullrun": 2.2, "bull run": 2.2, "capitulation": -2.2,
    "fud": -1.5, "fomo": 1.0, "whale": 0.3, "halving": 0.8, "regulatory": -0.3,
    "regulation": -0.3, "approval": 1.5, "approved": 1.5, "reject": -1.5, "rejected": -1.5,
}

_analyzer = None
_reddit_client = None


def _get_analyzer():
    global _analyzer
    if _analyzer is None:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        _analyzer = SentimentIntensityAnalyzer()
        _analyzer.lexicon.update(FINANCE_LEXICON)
    return _analyzer


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


def _base_symbol(ticker: str) -> str:
    return ticker.split("-")[0].split("/")[0].upper()


def fetch_reddit_posts(subreddit_names, ticker, limit=20):
    if not (os.environ.get("REDDIT_CLIENT_ID") and os.environ.get("REDDIT_CLIENT_SECRET")):
        logger.info("Reddit sentiment requested but REDDIT_CLIENT_ID/SECRET are not configured - skipping")
        return []

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


def fetch_rss_news(ticker, feed_urls=None, limit=10):
    """Free, always-available crypto headlines - no API key, no rate-limit surprises
    (unlike commercial crypto data APIs, whose free tiers have a habit of vanishing).
    Filters by ticker/name match; if too few match, pads with the latest general
    headlines so a quiet news day still yields a market-sentiment proxy."""
    import feedparser

    feed_urls = feed_urls or DEFAULT_RSS_FEEDS
    symbol = _base_symbol(ticker)
    aliases = TICKER_ALIASES.get(symbol, [symbol.lower()])

    matched, unmatched = [], []
    for url in feed_urls:
        try:
            parsed = feedparser.parse(url)
            for entry in parsed.entries[: limit * 3]:
                title = getattr(entry, "title", "") or ""
                summary = getattr(entry, "summary", "") or ""
                text = f"{title}. {summary}"[:400]
                haystack = text.lower()
                if any(alias in haystack for alias in aliases):
                    matched.append(text)
                else:
                    unmatched.append(text)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Error fetching RSS feed %s: %s", url, exc)

    if len(matched) >= 3:
        return matched[:limit]
    return (matched + unmatched)[:limit]


def fetch_cryptopanic_news(ticker, limit=10):
    api_key = os.environ.get("CRYPTOPANIC_API_KEY")
    if not api_key:
        logger.info("CryptoPanic sentiment requested but CRYPTOPANIC_API_KEY is not configured - skipping")
        return []

    try:
        resp = requests.get(
            "https://cryptopanic.com/api/v1/posts/",
            params={"auth_token": api_key, "currencies": _base_symbol(ticker), "kind": "news"},
            timeout=10,
        )
        resp.raise_for_status()
        posts = resp.json().get("results", [])[:limit]
        return [p["title"] for p in posts if p.get("title")]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Error fetching CryptoPanic news for %s: %s", ticker, exc)
        return []


def fetch_yahoo_finance_headlines(ticker, limit=10):
    """Headline-only (no full-article scraping) - lighter and far more reliable than
    downloading/parsing arbitrary article pages, at the cost of only seeing the title."""
    try:
        import yfinance as yf

        news_data = yf.Ticker(ticker).news or []
        return [item["title"] for item in news_data[:limit] if item.get("title")]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Error fetching Yahoo Finance news for %s: %s", ticker, exc)
        return []


def analyze_sentiments(texts):
    cleaned = [clean_text(t[:400]) for t in texts if t and isinstance(t, str)]
    if not cleaned:
        return pd.DataFrame({"text": [], "sentiment": [], "score": []})

    analyzer = _get_analyzer()
    labels, scores = [], []
    for text in cleaned:
        compound = analyzer.polarity_scores(text)["compound"]
        if compound >= 0.05:
            labels.append("positive")
        elif compound <= -0.05:
            labels.append("negative")
        else:
            labels.append("neutral")
        scores.append(compound)

    return pd.DataFrame({"text": cleaned, "sentiment": labels, "score": scores})


def _percentages(df):
    if df.empty:
        return {"positive": 0.0, "negative": 0.0, "neutral": 100.0}
    counts = df["sentiment"].str.lower().value_counts(normalize=True) * 100
    return {
        "positive": round(float(counts.get("positive", 0.0)), 2),
        "negative": round(float(counts.get("negative", 0.0)), 2),
        "neutral": round(float(counts.get("neutral", 0.0)), 2),
    }


def fetch_sentiment(ticker, subreddits=None, limit=20, sources=None):
    """Returns {"reddit": {"positive","negative","neutral"}, "news": {...}} for a ticker.

    `sources` toggles which of reddit/rss_news/cryptopanic/yahoo_finance to pull from
    (see DEFAULT_SOURCES); "news" pools whichever non-Reddit sources are enabled.
    """
    sources = {**DEFAULT_SOURCES, **(sources or {})}
    subreddits = subreddits or DEFAULT_SUBREDDITS

    reddit_texts = []
    if sources.get("reddit"):
        posts = fetch_reddit_posts(subreddits, ticker, limit=limit)
        reddit_texts = [f"Title: {p['title']} Body: {clean_text(p['selftext'])}" for p in posts]

    news_texts = []
    if sources.get("rss_news"):
        news_texts += fetch_rss_news(ticker, limit=limit)
    if sources.get("cryptopanic"):
        news_texts += fetch_cryptopanic_news(ticker, limit=limit)
    if sources.get("yahoo_finance"):
        news_texts += fetch_yahoo_finance_headlines(ticker, limit=limit)

    return {
        "reddit": _percentages(analyze_sentiments(reddit_texts)),
        "news": _percentages(analyze_sentiments(news_texts)),
    }
