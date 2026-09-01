import pytest

from app.sentiment_engine.pipeline import _percentages, analyze_sentiments


def test_analyze_sentiments_detects_bullish_finance_language():
    df = analyze_sentiments(["Bitcoin is bullish and rallying to a new all-time high"])
    assert df.iloc[0]["sentiment"] == "positive"


def test_analyze_sentiments_detects_bearish_finance_language():
    df = analyze_sentiments(["The exchange was hacked and the token crashed after the rug pull"])
    assert df.iloc[0]["sentiment"] == "negative"


def test_analyze_sentiments_neutral_for_plain_factual_text():
    df = analyze_sentiments(["The market opened at 9:30 AM as scheduled"])
    assert df.iloc[0]["sentiment"] == "neutral"


def test_analyze_sentiments_empty_input_returns_empty_frame():
    df = analyze_sentiments([])
    assert df.empty


def test_percentages_sum_to_100():
    df = analyze_sentiments(["Bullish rally to new highs", "Bearish crash and collapse", "The market opened today"])
    pct = _percentages(df)
    # Three independently-rounded thirds can total 99.99, not 100 - a rounding
    # artifact, not a bug, hence the tolerance rather than an exact match.
    assert pct["positive"] + pct["negative"] + pct["neutral"] == pytest.approx(100.0, abs=0.05)


def test_percentages_of_empty_frame_defaults_to_neutral():
    import pandas as pd

    pct = _percentages(pd.DataFrame({"text": [], "sentiment": [], "score": []}))
    assert pct == {"positive": 0.0, "negative": 0.0, "neutral": 100.0}
