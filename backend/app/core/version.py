from pathlib import Path

def get_app_version() -> str:
    """Read version from VERSION file."""
    version_file = Path(__file__).parent.parent.parent / "VERSION"
    try:
        return version_file.read_text().strip()
    except FileNotFoundError:
        return "v0.0.0-unknown"

APP_VERSION = get_app_version()
