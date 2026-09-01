import re

from bs4 import BeautifulSoup


def clean_text(text):
    """Cleans the input text by removing HTML tags, punctuation, and extra whitespace.

    Args:
        text: The input text string.

    Returns:
        The cleaned text string.
    """
    if not isinstance(text, str):
        text = str(text)

    soup = BeautifulSoup(text, "html.parser")
    text = soup.get_text()

    text = re.sub(r"[^\w\s]", "", text)
    text = text.lower()
    text = " ".join(text.split())

    return text
