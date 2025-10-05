import re
from bs4 import BeautifulSoup


def clean_text(text):
    """
    Cleans the input text by removing HTML tags, punctuation, and extra whitespace.

    Args:
        text: The input text string.

    Returns:
        The cleaned text string.
    """
    # Ensure text is a string
    if not isinstance(text, str):
        text = str(text)

    # Remove HTML tags
    soup = BeautifulSoup(text, "html.parser")
    text = soup.get_text()

    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)

    # Convert to lowercase
    text = text.lower()

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text