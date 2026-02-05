import re


def normalize_phone_number(number: str) -> str:
    """
    Normalizes a phone number by removing all non-digits.
    If the number starts with '0', it's kept (some regions use leading zero).
    Example: '+91 97371 49414' -> '919737149414'
    Example: '919737149414' -> '919737149414'
    """
    if not number:
        return ""
    # Remove all non-digits
    normalized = re.sub(r"\D", "", str(number))
    return normalized
